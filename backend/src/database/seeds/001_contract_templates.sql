-- TuAsesor — Contract Templates Seeds
INSERT INTO contract_templates (type, jurisdiction, name, description, content_html, required_fields, default_clauses) VALUES

('alquiler', 'argentina',
'Contrato de Locación Residencial — Argentina',
'Template para alquiler residencial bajo Ley 27.551',
'<div style="font-family: Times New Roman, serif; padding: 20px;">
<h1 style="text-align:center;text-transform:uppercase;font-size:16pt">CONTRATO DE LOCACIÓN</h1>
<p style="text-align:center">Ciudad de {{ciudad}}, {{fecha}}</p>

<h2>PARTES</h2>
<p><strong>LOCADOR:</strong> {{nombre_locador}}, DNI {{dni_locador}}, con domicilio en {{domicilio_locador}}.</p>
<p><strong>LOCATARIO:</strong> {{nombre_locatario}}, DNI {{dni_locatario}}, con domicilio en {{domicilio_locatario}}.</p>

<h2>OBJETO</h2>
<p>El locador da en locación al locatario el inmueble ubicado en {{direccion_inmueble}}, para uso exclusivamente habitacional.</p>

<h2>CLÁUSULA PRIMERA — PLAZO</h2>
<p>El plazo de la locación será de {{plazo}} años, contados desde el {{fecha_inicio}}, con vencimiento el {{fecha_fin}}. En cumplimiento de la Ley 27.551, el plazo mínimo es de tres (3) años.</p>

<h2>CLÁUSULA SEGUNDA — CANON LOCATIVO</h2>
<p>El canon locativo mensual es de PESOS {{monto_alquiler}} ($ {{monto_alquiler}}), ajustable según el Índice Casa Propia (ICP) elaborado por el BCRA, con periodicidad anual.</p>

<h2>CLÁUSULA TERCERA — DEPÓSITO EN GARANTÍA</h2>
<p>El locatario entrega en este acto la suma de PESOS {{deposito}} (equivalente a {{cantidad_meses}} meses de alquiler) en concepto de depósito en garantía, que será devuelto al finalizar el contrato.</p>

<h2>CLÁUSULA CUARTA — EXPENSAS Y SERVICIOS</h2>
<p>Las expensas ordinarias estarán a cargo del locatario. Las extraordinarias corresponden al locador. Los servicios de agua, gas, electricidad e internet corresponden al locatario.</p>

<h2>CLÁUSULA QUINTA — DESTINO</h2>
<p>El inmueble se destina exclusivamente a vivienda familiar del locatario. No podrá subarrendarse sin consentimiento escrito del locador.</p>

<h2>CLÁUSULA SEXTA — RESCISIÓN ANTICIPADA</h2>
<p>Conforme al Art. 1221 del CCyC, el locatario podrá rescindir el contrato en cualquier momento, notificando con la antelación prevista en la ley. Si la rescisión ocurre antes de los 6 meses, corresponde una indemnización de mes y medio de alquiler.</p>

<h2>CLÁUSULA SÉPTIMA — REPARACIONES</h2>
<p>Las reparaciones urgentes y las que hacen al mantenimiento de la habitabilidad están a cargo del locador. Las mejoras por uso son a cargo del locatario.</p>

<div style="margin-top:60px;display:flex;justify-content:space-between">
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">LOCADOR<br>{{nombre_locador}}<br>DNI: {{dni_locador}}</p>
</div>
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">LOCATARIO<br>{{nombre_locatario}}<br>DNI: {{dni_locatario}}</p>
</div>
</div>
</div>',
'["ciudad", "fecha", "nombre_locador", "dni_locador", "nombre_locatario", "dni_locatario", "direccion_inmueble", "plazo", "fecha_inicio", "fecha_fin", "monto_alquiler"]',
'["plazo_minimo_3_anios", "ajuste_icp_bcra", "rescision_anticipada_art1221"]'),

('nda', 'argentina',
'Acuerdo de Confidencialidad (NDA) — Argentina',
'Non-Disclosure Agreement para Argentina',
'<div style="font-family: Times New Roman, serif; padding: 20px;">
<h1 style="text-align:center;text-transform:uppercase">ACUERDO DE CONFIDENCIALIDAD</h1>
<p style="text-align:center">{{ciudad}}, {{fecha}}</p>

<h2>PARTES</h2>
<p><strong>PARTE DIVULGANTE:</strong> {{nombre_divulgante}}, CUIT {{cuit_divulgante}}</p>
<p><strong>PARTE RECEPTORA:</strong> {{nombre_receptora}}, CUIT {{cuit_receptora}}</p>

<h2>DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL</h2>
<p>Se considera información confidencial toda información técnica, comercial, financiera, de clientes, proveedores, estrategias de negocio y cualquier otro dato no público que una parte revele a la otra.</p>

<h2>OBLIGACIONES</h2>
<p>La Parte Receptora se compromete a: (i) mantener estricta confidencialidad; (ii) no divulgar a terceros; (iii) usar únicamente para el propósito acordado; (iv) implementar medidas de seguridad razonables.</p>

<h2>PLAZO</h2>
<p>Este acuerdo tendrá vigencia de {{plazo_anios}} años desde la firma.</p>

<h2>EXCEPCIONES</h2>
<p>Las obligaciones no aplican a información que: sea de dominio público, ya fuera conocida por la receptora, deba revelarse por orden judicial.</p>

<h2>JURISDICCIÓN</h2>
<p>Las partes se someten a los tribunales ordinarios de {{ciudad_jurisdiccion}}.</p>

<div style="margin-top:60px;display:flex;justify-content:space-between">
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">PARTE DIVULGANTE<br>{{nombre_divulgante}}</p>
</div>
<div style="width:45%;text-align:center">
<p style="border-top:1px solid #000;padding-top:8px">PARTE RECEPTORA<br>{{nombre_receptora}}</p>
</div>
</div>
</div>',
'["nombre_divulgante", "cuit_divulgante", "nombre_receptora", "cuit_receptora", "plazo_anios"]',
'["confidencialidad_absoluta", "jurisdiccion_ordinaria"]');
