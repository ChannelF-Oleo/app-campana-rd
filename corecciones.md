# Plan de correcciones — app-campana-rd

Orden pensado por dependencia: primero reparar el daño de datos, luego evitar que se repita, y al final UI/performance.

---

## FASE 1 — Diagnóstico y respaldo (antes de tocar nada)

1. **Backup completo de Firestore** (colecciones `usuarios` y `simpatizantes`) antes de cualquier script de migración o deduplicación.
2. **Auditoría de formato de cédula**: contar cuántos documentos tienen cédula con guiones vs. sin guiones, y detectar otros formatos inconsistentes (espacios, mayúsculas, etc.).

## FASE 2 — Reparar el daño (duplicados existentes)

**Modelo de datos confirmado**: se mantienen `usuarios` y `simpatizantes` como colecciones separadas, vinculadas entre sí por cédula (sin guiones) y por UID. No se fusionan en un solo documento.

3. **Normalizar cédulas** en todos los documentos existentes de `usuarios` y `simpatizantes`. **Estándar definido: solo dígitos, sin guiones.** Al mostrar la cédula en la UI se puede formatear con guiones si se quiere, pero en Firestore se guarda siempre sin guiones.
4. **Script de deduplicación** en `simpatizantes`: agrupar por cédula normalizada, conservar el documento más completo (más campos llenos / más reciente), fusionar datos si hace falta, eliminar los sobrantes.
5. **Vincular usuarios ↔ simpatizantes existentes** por cédula normalizada: guardar el UID del usuario dentro del documento de simpatizante correspondiente (campo tipo `uid` o `usuarioId`).
6. **Verificación manual post-migración**: contar total de simpatizantes antes/después y confirmar que vuelve a los ~65 esperados.

## FASE 3 — Evitar que se repita (lógica de creación)

7. **Regla al crear usuario**: si la cédula ya existe en `simpatizantes`, no crear un nuevo documento en `simpatizantes` — solo vincular por UID.
8. **Regla al crear simpatizante**: si la cédula ya existe en `usuarios`, no crear un nuevo documento en `simpatizantes` — crear el documento de simpatizante (o actualizarlo si ya existía) y vincularlo guardando el UID del usuario, manteniendo ambas colecciones separadas pero relacionadas por cédula/UID.
9. **Validación de formato de cédula** al guardar (normalizar siempre a un mismo formato antes de escribir en Firestore), para que no vuelva a pasar lo de guiones/sin guiones.

## FASE 4 — Bugs del formulario de creación de usuario

10. **Bug: cédula no se guarda** — revisar el formulario de creación de usuario en el Dashboard, probablemente un problema de estado (el campo no se está incluyendo en el payload que se envía a Firestore).
11. **Bug: error de Resend al crear usuario** — separar la creación del usuario en Firestore/Auth del envío del correo de bienvenida, para que un fallo en el envío de email no aparente que el usuario no se creó.
12. **Bug: "Volver a la lista" da 404** — revisar la ruta del router en esa vista.

## FASE 5 — Cambios de formulario y datos requeridos

13. **Igualar campos del formulario de usuario** con los del formulario de simpatizante.
14. **Email opcional, teléfono obligatorio** en ambos formularios.

## FASE 6 — Vista de gestión de usuarios

15. **Mostrar teléfono en vez de email** en la lista de gestión de usuarios.
16. **Optimizar carga de fotos de perfil**: usar miniaturas/thumbnails o lazy loading en vez de cargar la imagen completa en la lista.
17. **Modal del visor de foto**: ajustar el tamaño del modal al de la imagen (tipo `max-width/max-height: 90vh`, centrado, sin scroll), como un marco ajustado a la foto.

## FASE 7 — Exportar a Excel

18. **Corregir columnas de exportación**: cambiar de `Nombre, Mail, rol, cédula, registros, UID` a `Nombre, cédula, teléfono, rol, zona, dirección, registros`.

---

## Notas para ejecutar en Claude Code

- Las Fases 1 y 2 son las más delicadas (tocan datos reales) — conviene probar el script de deduplicación primero contra un export/copia, no directo en producción.
- Las Fases 3–7 son cambios de código normales, se pueden hacer con PRs separados como ya vienen trabajando (branch desde `main`, revisión del tech lead).
- Sugerencia de agrupación de PRs:
  - PR 1: Fases 1–2 (script de migración/deduplicación, se corre una sola vez)
  - PR 2: Fase 3 (lógica anti-duplicados + normalización de cédula)
  - PR 3: Fase 4 (bugs del formulario de usuario)
  - PR 4: Fases 5–6 (formulario, vista de usuarios, modal, performance)
  - PR 5: Fase 7 (exportación a Excel)