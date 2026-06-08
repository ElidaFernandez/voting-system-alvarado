/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Seed de alumnos desde planillas .xls/.xlsx
 *
 * - Lee TODOS los archivos en ./seeds (relativos a la raíz del proyecto)
 * - Cada archivo es una planilla "Planilla de Alumnos" con el formato del Alvarado:
 *     · Fila con "Curso/División:" en col 1 y valor en col 6
 *     · Fila header "#, Documento, Apellido y Nombre"
 *     · Filas de datos: col 4 = "DNI: XXXXXXXX", col 7 = "APELLIDO, NOMBRE"
 * - Si un alumno ya existe (mismo DNI) se actualiza fullName/course/enabled
 * - Si no existe, se inserta nuevo
 *
 * Uso:
 *   DATABASE_URL=postgres://... npm run seed:students
 *
 * Variables de entorno opcionales:
 *   SEEDS_DIR=./seeds   (default)
 *   SEED_DEFAULT_ENABLED=true  (alumnos cargados quedan habilitados por default)
 */

import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';
import { Student } from '../src/students/student.entity';

dotenv.config();

type Row = (string | number | null | undefined)[];

interface ParsedStudent {
  dni: string;
  fullName: string;
  course: string;
}

function normalizeCourse(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\s+/g, ' ')
    .replace(/º/g, '°')
    .trim();
}

function parseSheet(rows: Row[], fallbackCourse: string): ParsedStudent[] {
  // Buscar "Curso/División:" para obtener el curso
  let course = fallbackCourse;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const r = rows[i] || [];
    for (let c = 0; c < r.length; c++) {
      const cell = String(r[c] ?? '').trim();
      if (/curso\/?divisi/i.test(cell)) {
        // El valor suele estar en la misma fila, hacia la derecha
        for (let k = c + 1; k < r.length; k++) {
          const v = String(r[k] ?? '').trim();
          if (v) {
            course = normalizeCourse(v);
            break;
          }
        }
      }
    }
  }

  // Buscar fila header "Apellido y Nombre"
  let headerIdx = -1;
  let dniCol = -1;
  let nameCol = -1;

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const r = rows[i] || [];
    for (let c = 0; c < r.length; c++) {
      const cell = String(r[c] ?? '').toLowerCase();
      if (cell.includes('apellido y nombre')) {
        headerIdx = i;
        nameCol = c;
      }
      if (cell === 'documento') {
        dniCol = c;
      }
    }
    if (headerIdx !== -1) break;
  }

  if (headerIdx === -1) {
    return [];
  }

  // Si no detectamos la columna del DNI, asumimos la del default (col 4)
  if (dniCol === -1) dniCol = 4;

  const students: ParsedStudent[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || [];

    const dniRaw = String(r[dniCol] ?? '').trim();
    const fullNameRaw = String(r[nameCol] ?? '').trim();

    if (!dniRaw || !fullNameRaw) continue;

    // DNI viene como "DNI: 49878703" -> extraer solo dígitos
    const dniMatch = dniRaw.match(/(\d{6,})/);
    if (!dniMatch) continue;

    const dni = dniMatch[1];
    const fullName = fullNameRaw.replace(/\s+/g, ' ').trim();

    students.push({
      dni,
      fullName,
      course,
    });
  }

  return students;
}

async function main() {
  const seedsDir = path.resolve(
    process.cwd(),
    process.env.SEEDS_DIR || 'seeds',
  );

  if (!fs.existsSync(seedsDir)) {
    console.error(`❌ Carpeta de seeds no encontrada: ${seedsDir}`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no definido. Setealo y volvé a correr.');
    process.exit(1);
  }

  const files = fs
    .readdirSync(seedsDir)
    .filter((f) => /\.(xlsx?|xlsm)$/i.test(f));

  if (files.length === 0) {
    console.error(`❌ No hay planillas .xls/.xlsx en ${seedsDir}`);
    process.exit(1);
  }

  console.log(`📂 Carpeta de seeds: ${seedsDir}`);
  console.log(`📑 Archivos encontrados: ${files.length}`);

  const allStudents: ParsedStudent[] = [];
  const fileSummary: { file: string; count: number; course: string }[] = [];

  for (const file of files) {
    const filePath = path.join(seedsDir, file);
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    const fallbackCourse = path.basename(file, path.extname(file));
    const parsed = parseSheet(rows, fallbackCourse);

    allStudents.push(...parsed);
    fileSummary.push({
      file,
      count: parsed.length,
      course: parsed[0]?.course ?? fallbackCourse,
    });
  }

  console.log('\n📋 Resumen por archivo:');
  for (const s of fileSummary) {
    console.log(`  · ${s.file}  →  ${s.count} alumnos  (curso: ${s.course})`);
  }
  console.log(`\n👥 Total a procesar: ${allStudents.length}`);

  // Detectar duplicados de DNI antes de tocar la DB
  const seen = new Map<string, ParsedStudent>();
  const duplicates: ParsedStudent[] = [];
  for (const st of allStudents) {
    if (seen.has(st.dni)) {
      duplicates.push(st);
    } else {
      seen.set(st.dni, st);
    }
  }

  if (duplicates.length > 0) {
    console.log(
      `\n⚠️  DNIs duplicados entre archivos: ${duplicates.length} (se quedan con el primero):`,
    );
    duplicates.slice(0, 10).forEach((d) => {
      console.log(`     · ${d.dni}  ${d.fullName}  (${d.course})`);
    });
  }

  const uniqueStudents = Array.from(seen.values());

  // Conectar a la DB
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Student],
    synchronize: false,
    ssl:
      process.env.NODE_ENV === 'production' ||
      /render\.com|amazonaws|supabase/i.test(process.env.DATABASE_URL || '')
        ? { rejectUnauthorized: false }
        : false,
  });

  await ds.initialize();
  console.log('\n🔌 Conectado a PostgreSQL.');

  const repo = ds.getRepository(Student);

  const defaultEnabled =
    (process.env.SEED_DEFAULT_ENABLED ?? 'true').toLowerCase() !== 'false';

  let created = 0;
  let updated = 0;

  for (const st of uniqueStudents) {
    const existing = await repo.findOne({ where: { dni: st.dni } });
    if (existing) {
      existing.fullName = st.fullName;
      existing.course = st.course;
      // No tocamos `enabled` en updates para no pisar decisiones manuales
      await repo.save(existing);
      updated++;
    } else {
      const entity = repo.create({
        dni: st.dni,
        fullName: st.fullName,
        course: st.course,
        enabled: defaultEnabled,
      });
      await repo.save(entity);
      created++;
    }
  }

  console.log(`\n✅ Listo.`);
  console.log(`   · Insertados: ${created}`);
  console.log(`   · Actualizados: ${updated}`);
  console.log(`   · Total en base ahora: ${await repo.count()}`);

  await ds.destroy();
}

main().catch((e) => {
  console.error('❌ Error en el seed:', e);
  process.exit(1);
});
