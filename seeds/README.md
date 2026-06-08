# Planillas de alumnos

Dejá acá los .xls/.xlsx exportados desde el sistema de gestión escolar (uno por curso/división).
El script `npm run seed:students` los procesa todos.

Formato esperado en cada planilla:
- Fila con `Curso/División:` y el valor del curso a la derecha
- Fila header con `#`, `Documento`, `Apellido y Nombre`
- Datos por alumno: `DNI: XXXXXXXX` y `APELLIDO, NOMBRE`

Ya está cubierto el formato que exporta el sistema actual de la escuela.
