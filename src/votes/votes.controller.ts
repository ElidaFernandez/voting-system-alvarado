/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */

import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { AdminGuard } from '../auth/admin.guard';

const PDFDocument = require('pdfkit');

type VoteResult = {
  option: string;
  total: string;
};

type StatsResult = {
  totalStudents: number;
  totalVotes: number;
  participation: number;
};

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  async create(@Body() createVoteDto: CreateVoteDto) {
    return this.votesService.create(createVoteDto);
  }

  @UseGuards(AdminGuard)
  @Get('results')
  async getResults() {
    return this.votesService.getResults();
  }

  @UseGuards(AdminGuard)
  @Get('stats')
  async getStats() {
    return this.votesService.getStats();
  }

  @UseGuards(AdminGuard)
  @Get('acta')
  async generateActa(@Res() res: Response) {
    const results = (await this.votesService.getResults()) as VoteResult[];
    const stats = (await this.votesService.getStats()) as StatsResult;

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=acta-eleccion.pdf');

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;

    const negro = '#000000';
    const rojo = '#b71c1c';
    const rojoClaro = '#fdeaea';
    const grisTexto = '#37474f';

    const logoPath = path.join(
      process.cwd(),
      'src',
      'assets',
      'logo-alvarado.png',
    );
    const hasLogo = fs.existsSync(logoPath);

    doc
      .roundedRect(margin, 40, pageWidth - margin * 2, 110, 12)
      .fillAndStroke(rojoClaro, rojo);

    if (hasLogo) {
      doc.image(logoPath, margin + 12, 52, {
        fit: [70, 70],
        align: 'center',
        valign: 'center',
      });
    }

    doc.fillColor(negro).fontSize(18).font('Helvetica-Bold');
    doc.text('ACTA DE ELECCIÓN', 140, 58, {
      width: pageWidth - 200,
      align: 'center',
    });

    doc.fontSize(13).font('Helvetica-Bold');
    doc.text(
      'Colegio Secundario "Dr. Roberto I. López Alvarado"',
      140,
      85,
      {
        width: pageWidth - 200,
        align: 'center',
      },
    );

    doc.fontSize(11).font('Helvetica').fillColor(grisTexto);
    doc.text('Centro de Estudiantes · Goya, Corrientes', 140, 108, {
      width: pageWidth - 200,
      align: 'center',
    });

    doc.y = 175;

    doc.fillColor('#000000').fontSize(11).font('Helvetica');
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-AR')}`, {
      align: 'right',
    });

    doc.moveDown(1.5);

    doc.fillColor(rojo).fontSize(13).font('Helvetica-Bold');
    doc.text('1. Datos generales', { underline: true });
    doc.moveDown(0.8);

    doc.font('Helvetica').fontSize(12).fillColor('#000000');
    doc.text(`Total de alumnos habilitados: ${stats.totalStudents}`);
    doc.text(`Total de votos emitidos: ${stats.totalVotes}`);
    doc.text(`Porcentaje de participación: ${stats.participation}%`);

    doc.moveDown(1.5);

    doc.fillColor(rojo).fontSize(13).font('Helvetica-Bold');
    doc.text('2. Resultados por lista', { underline: true });
    doc.moveDown(0.8);

    results.forEach((r) => {
      const boxX = margin;
      const boxY = doc.y;
      const boxWidth = 495;
      const votosX = 420;

      doc
        .roundedRect(boxX, boxY, boxWidth, 32, 8)
        .fillAndStroke('#fff5f5', '#ef9a9a');

      doc
        .fillColor(negro)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(r.option, 65, boxY + 9, {
          width: 330,
        });

      doc
        .fillColor('#000000')
        .font('Helvetica')
        .fontSize(12)
        .text(`${r.total} votos`, votosX, boxY + 9);

      doc.y = boxY + 32;
      doc.moveDown(0.6);
    });

    doc.x = margin;
    doc.moveDown(1.3);

    const sorted: VoteResult[] = [...results].sort(
      (a, b) => Number(b.total) - Number(a.total),
    );

    const first = sorted[0];
    const maxVotes = first ? Number(first.total) : 0;
    const winners = sorted.filter((item) => Number(item.total) === maxVotes);

    doc.fillColor(rojo).fontSize(13).font('Helvetica-Bold');
    doc.text('3. Resultado final', margin, doc.y, {
      underline: true,
      width: pageWidth - margin * 2,
    });
    doc.moveDown(0.8);

    doc.fillColor('#000000').font('Helvetica').fontSize(12);

    if (first) {
      if (winners.length > 1) {
        doc.text(
          'Se registra un empate entre las listas participantes.',
          margin,
          doc.y,
          {
            width: pageWidth - margin * 2,
          },
        );
      } else {
        doc.text(`La lista ganadora es: ${first.option}.`, margin, doc.y, {
          width: pageWidth - margin * 2,
        });
      }
    } else {
      doc.text(
        'No se registraron votos en la presente elección.',
        margin,
        doc.y,
        {
          width: pageWidth - margin * 2,
        },
      );
    }

    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica');
    doc.text(
      'Siendo verificados los resultados consignados, se deja constancia de la finalización del acto electoral para su correspondiente validación institucional.',
      margin,
      doc.y,
      {
        width: pageWidth - margin * 2,
        align: 'justify',
      },
    );

    doc.moveDown(4);

    const firmaY = doc.y;

    doc.font('Helvetica').fontSize(11).fillColor('#000000');

    doc.text('_____________________________', 70, firmaY);
    doc.text('Firma Autoridad 1', 105, firmaY + 20);

    doc.text('_____________________________', 320, firmaY);
    doc.text('Firma Autoridad 2', 355, firmaY + 20);

    doc
      .fontSize(10)
      .fillColor(grisTexto)
      .text(
        'Sistema de votación estudiantil · Colegio Secundario "Dr. Roberto I. López Alvarado"',
        margin,
        doc.page.height - 50,
        {
          align: 'center',
          width: pageWidth - margin * 2,
        },
      );

    doc.end();
  }
}
