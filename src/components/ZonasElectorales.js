/**
 * MAPA ELECTORAL COMPLETO
 * Estructura de datos extraída del listado de carpetas (tree /f /a).
 * Incluye Zonas, Centros de Votación (Colegios) y los archivos de Padrón asociados.
 * Utilizar para filtros de asignación y referenciación de documentos.
 */

// 1. LISTA SIMPLE DE ZONAS (Para Selectores de Nivel Zonal)
export const ZONAS_DISPONIBLES = [
    "ZONA A1", "ZONA A", "ZONA B", "ZONA C", "ZONA D", "ZONA E", 
    "ZONA F", "ZONA G", "ZONA H", "ZONA I", "ZONA J", "ZONA K", 
    "ZONA L", "ZONA M", "ZONA N", "ZONA O", "ZONA P", "ZONA Q", 
    "ZONA R", "ZONA S", "ZONA T", "ZONA U", "ZONA W", "ZONA X", 
    "ZONA Y", "ZONA Z", "ZONA Ñ"
];

// 2. MAPEO DETALLADO DE ZONAS A SUS CENTROS (Colegios/Sectores)
// Estructura: { [Zona]: [Centro1, Centro2, ...] }
export const MAPA_CENTROS_POR_ZONA = {
    "ZONA A1": [
        "00457 - CENTRO COMUNAL EL CAFÉ", 
        "00512 - ESCUELA BASICA CAFÉ CON LECHE", 
        "00545 - LICEO CARMEN LUISA DE LOS SANTOS"
    ],
    "ZONA A": [
        "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA", 
        "00520 - COLEGIO EVANGELICO SHALOM"
    ],
    "ZONA B": [
        "00260 - CLINICA DIAZ PIÑEYRO", 
        "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA", 
        "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA",
        "00417 - CENTRO DE ESTUDIOS PENIEL", 
        "00458 - COLEGIO MAXIMO GOMEZ", 
        "00517 - SALON PARROQUIAL", 
        "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO"
    ],
    "ZONA C": [
        "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ", 
        "00488 - ESCUELA PRIMARIA VILLA NAZARET", 
        "00498 - COLEGIO GREGORIO LUPERON"
    ],
    "ZONA D": [
        "00306 - ESCUELA CAMILA HENRIQUEZ", 
        "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN"
    ],
    "ZONA E": [
        "00264 - COLEGIO AMERICO LUGO", 
        "00354 - COLEGIO EL BUEN PASTOR", 
        "00355 - COLEGIO HORA DE DIOS",
        "00500 - COLEGIO ADVENTISTA BETEL", 
        "00535 - ESCUELA PRIMARIA LOS AMIGUITOS"
    ],
    "ZONA F": [
        "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA", 
        "00428 - ESCUELA DOÑA FILOMENA CANALDA"
    ],
    "ZONA G": [
        "00353 - HOSPITAL ZONA NORTE", 
        "00363 - ESCUELA PRIMARIA DUARTE", 
        "00430 - ESCUELA PRIMARIA RENOVACION", 
        "00479 - CENTRO DE ESTUDIO PROGRESO"
    ],
    "ZONA H": [
        "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS", 
        "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA"
    ],
    "ZONA I": [
        "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO", 
        "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS", 
        "00431 - ESCUELA PUBLICA LAS MERCEDES", 
        "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI"
    ],
    "ZONA J": [
        "00370 - POLITECNICO DE LAS CAOBAS", 
        "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA", 
        "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA"
    ],
    "ZONA K": [
        "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES", 
        "00416 - ESCUELA BASICA CURAZAO", 
        "00459 - UNIVERSIDAD UTESA", 
        "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL",
        "00529 - COLEGIO SAN ANTON", 
        "00546 - LICEO PEDRO APONTE"
    ],
    "ZONA L": [
        "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL", 
        "00435 - LICEO SECUNDARIO LAS AMERICAS", 
        "00490 - ESCUELA BASICA JAPON"
    ],
    "ZONA M": [
        "00365 - ESCUELA BASICA JAMAICA", 
        "00511 - CENTRO EDUC. INDEPENDENCIA", 
        "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES", 
        "00544 - LICEO ADELAIDA ACOSTA"
    ],
    "ZONA N": [
        "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO", 
        "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA", 
        "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO", 
        "00541 - ESCUELA BASICA CONCEPCION BONA"
    ],
    "ZONA O": [
        "00367 - MANOGUAYABO", 
        "00435 - LICEO SECUNDARIO LAS AMERICAS", 
        "00516 - COLEGIO INFANTIL LOS QUERUBINES", 
        "00525 - COLEGIO TRAZO DE COLORES"
    ],
    "ZONA P": [
        "00001 - COLEGIO EL ANGEL", 
        "00356 - COLEGIO JUAN 23", 
        "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO"
    ],
    "ZONA Q": [
        "00425 - ESCUELA BASICA LAS PALMAS #1", 
        "00487 - ESCUELA VEDRUNA", 
        "00492 - COLEGIO SANTA MARIA", 
        "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO"
    ],
    "ZONA R": [
        "00361 - ESCUELA ING. AGR. IVAN GUZMAN K", 
        "00455 - EXTENSION DE LA UASD", 
        "00515 - HOSPITAL MUNICIPAL DE ENGOMBE"
    ],
    "ZONA S": [
        "00362 - ESCUELA PRIMARIA BUENOS AIRES", 
        "00454 - CLUB 16 DE AGOSTO", 
        "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO"
    ],
    "ZONA T": [
        "00338 - COMEDOR ECONOMICO", 
        "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES", 
        "00526 - POLITECNICO MADRE RAFAELA IBARRA"
    ],
    "ZONA U": [
        "00513 - ESCUELA BASICA HERMANAS MIRABAL"
    ],
    "ZONA W": [
        "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL", 
        "00534 - SALON MULTIUSO EL ABANICO"
    ],
    "ZONA X": [
        "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO"
    ],
    "ZONA Y": [
        "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO"
    ],
    "ZONA Z": [
        "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO"
    ],
    "ZONA Ñ": [
        "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO", 
        "00453 - ESCUELA PADRE MARTIN EGUSQUIZA"
    ]
};

// 3. MAPEO COMPLETO DE CENTROS A SUS ARCHIVOS PDF (Padrón Electoral)
// Estructura: { [Centro de Votación]: [Archivo1.pdf, Archivo2.pdf, ...] }
export const MAPA_PADRON_POR_CENTRO = {
    // --- ZONA A1 ---
    "00457 - CENTRO COMUNAL EL CAFÉ": ["1312A.pdf", "1644.pdf", "1690.pdf", "1738.pdf", "1788.pdf", "1846.pdf", "1866.pdf"],
    "00512 - ESCUELA BASICA CAFÉ CON LECHE": ["1746.pdf", "1795.pdf", "1838.pdf", "1881.pdf"],
    "00545 - LICEO CARMEN LUISA DE LOS SANTOS": ["1260.pdf", "1260A.pdf", "1260B.pdf", "1260C.pdf", "1261.pdf", "1261A.pdf", "1312.pdf"],
    // --- ZONA A ---
    "00305 - ESC. PRIM. INT. RAFAELA SANTAELLA": ["1256.pdf", "1256A.pdf", "1256B.pdf", "1256C.pdf", "1256D.pdf", "1256E.pdf", "1259.pdf", "1259A.pdf", "1259B.pdf", "1259C.pdf"],
    "00520 - COLEGIO EVANGELICO SHALOM": ["1798.pdf", "1827.pdf", "1885.pdf", "1912.pdf"],
    // --- ZONA B ---
    "00260 - CLINICA DIAZ PIÑEYRO": ["1250.pdf", "1250A.pdf", "1250B.pdf"],
    "00261 - ESC. P. NTRA. SRA. DE LA ALTAGRACIA": ["1252.pdf", "1252A.pdf", "1252B.pdf", "1252C.pdf", "1252D.pdf", "1254.pdf", "1254A.pdf", "1254B.pdf", "1255.pdf", "1255A.pdf", "1255B.pdf", "1311.pdf", "1311A.pdf", "1311B.pdf", "1334.pdf", "1334A.pdf", "1334B.pdf", "1643.pdf", "1643A.pdf", "1643B.pdf"],
    "00262 - PARROQUIA NTRA.SRA. DE LA ALTAGRACIA": ["1251.pdf", "1251A.pdf", "1251B.pdf"],
    "00417 - CENTRO DE ESTUDIOS PENIEL": ["1380.pdf", "1380A.pdf", "1380B.pdf", "1380C.pdf", "1821.pdf", "1861.pdf"],
    "00458 - COLEGIO MAXIMO GOMEZ": ["1691.pdf", "1764.pdf", "1789.pdf", "1823.pdf", "1867.pdf"],
    "00517 - SALON PARROQUIAL": ["1778.pdf", "1883.pdf"],
    "00523 - POLITECNICO TURISTICO CENTRO PARROQUIAL SANTO SOCORRO": ["1253.pdf", "1253A.pdf", "1801.pdf"],
    // --- ZONA C ---
    "00357 - ESC. PRIM. E INTERMEDIA ESTEBAN MARTINEZ": ["1241.pdf", "1241A.pdf", "1241B.pdf", "1242.pdf", "1242A.pdf", "1242B.pdf", "1640.pdf", "1751.pdf", "1844.pdf", "1850.pdf"],
    "00488 - ESCUELA PRIMARIA VILLA NAZARET": ["1699.pdf", "1716.pdf", "1770.pdf", "1842.pdf", "1872.pdf"],
    "00498 - COLEGIO GREGORIO LUPERON": ["1719.pdf", "1773.pdf", "1876.pdf"],
    // --- ZONA D ---
    "00306 - ESCUELA CAMILA HENRIQUEZ": ["1258.pdf", "1258A.pdf", "1258B.pdf", "1258C.pdf", "1258D.pdf", "1258E.pdf", "1258F.pdf", "1646.pdf", "1646A.pdf", "1816.pdf"],
    "00522 - CENTRO DE ESTUDIO HUERTO DEL EDEN": ["1726.pdf", "1800.pdf", "1886.pdf"],
    // --- ZONA E ---
    "00264 - COLEGIO AMERICO LUGO": ["1244.pdf", "1244A.pdf", "1244B.pdf", "1244C.pdf", "1245.pdf", "1245A.pdf"],
    "00354 - COLEGIO EL BUEN PASTOR": ["1238.pdf", "1238A.pdf", "1238B.pdf", "1239.pdf", "1239A.pdf", "1239B.pdf"],
    "00355 - COLEGIO HORA DE DIOS": ["1240.pdf", "1240A.pdf", "1240B.pdf", "1308.pdf", "1308A.pdf", "1308B.pdf", "1750.pdf", "1817.pdf"],
    "00500 - COLEGIO ADVENTISTA BETEL": ["1721.pdf", "1774.pdf", "1826.pdf", "1877.pdf"],
    "00535 - ESCUELA PRIMARIA LOS AMIGUITOS": ["1720.pdf", "1735.pdf"],
    // --- ZONA F ---
    "00366 - ESCUELA PRIMARIA NICOLAS UREÑA DE MENDOZA": ["1217.pdf", "1217A.pdf", "1218.pdf", "1218A.pdf", "1218B.pdf", "1632.pdf", "1722.pdf", "1756.pdf", "1757.pdf", "1831.pdf", "1857.pdf"],
    "00428 - ESCUELA DOÑA FILOMENA CANALDA": ["1364.pdf", "1364A.pdf", "1364B.pdf", "1783.pdf", "1862.pdf"],
    // --- ZONA G ---
    "00353 - HOSPITAL ZONA NORTE": ["1275.pdf", "1275A.pdf", "1275B.pdf", "1275C.pdf", "1345B.pdf", "1639.pdf", "1807.pdf", "1818.pdf", "1854.pdf"],
    "00363 - ESCUELA PRIMARIA DUARTE": ["1232.pdf", "1232A.pdf", "1232B.pdf", "1233.pdf", "1233A.pdf", "1345.pdf", "1345A.pdf"],
    "00430 - ESCUELA PRIMARIA RENOVACION": ["1247.pdf", "1247A.pdf", "1248.pdf", "1248A.pdf", "1248B.pdf", "1642.pdf"],
    "00479 - CENTRO DE ESTUDIO PROGRESO": ["1680.pdf", "1792.pdf"],
    // --- ZONA H ---
    "00360 - ESCUELA BASICA ANTIGUA Y BARBADOS": ["1431.pdf", "1431A.pdf", "1431B.pdf", "1752.pdf", "1852.pdf", "1900.pdf"],
    "00508 - ESCUELA PRIMARIA MADRE TERESA DE CALCUTA": ["1729.pdf", "1776.pdf"],
    // --- ZONA I ---
    "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO": ["1306.pdf", "1306A.pdf", "1307.pdf", "1307A.pdf", "1333.pdf", "1333A.pdf", "1333B.pdf", "1357.pdf", "1357A.pdf", "1357B.pdf", "1391.pdf", "1391A.pdf", "1418.pdf", "1418A.pdf", "1418B.pdf", "1635.pdf", "1635A.pdf", "1636.pdf", "1636A.pdf", "1637.pdf"],
    "00359 - ESC. PRIMARIA INICIAL Y BASICA BARBADOS": ["1228.pdf", "1228A.pdf", "1228B.pdf", "1229.pdf", "1229A.pdf", "1229B.pdf", "1634.pdf", "1634A.pdf", "1781.pdf", "1851.pdf"],
    "00431 - ESCUELA PUBLICA LAS MERCEDES": ["1226.pdf", "1226A.pdf", "1227.pdf", "1227A.pdf", "1227B.pdf", "1230.pdf", "1230A.pdf", "1230B.pdf", "1784.pdf", "1813.pdf"],
    "00456 - COLEGIO PSICOEDUCATIVO GESTSMANI": ["1689.pdf", "1822.pdf"],
    // --- ZONA J ---
    "00370 - POLITECNICO DE LAS CAOBAS": ["1271.pdf", "1271A.pdf", "1271B.pdf", "1271C.pdf", "1271D.pdf", "1271E.pdf", "1271F.pdf", "1272.pdf", "1272A.pdf", "1272B.pdf", "1272C.pdf", "1272D.pdf", "1273.pdf", "1273A.pdf", "1274.pdf", "1274A.pdf", "1274B.pdf"],
    "00477 - UNIVERSIDAD ODONTOLOGICA DOMINICANA": ["1697.pdf", "1768.pdf", "1871.pdf"],
    "00519 - CENTRO EDUCATIVO LOS OLIVOS FE Y ALEGRIA": ["1797.pdf", "1884.pdf", "1911.pdf"],
    // --- ZONA K ---
    "00307 - ESCUELA BASICA LIC. CRISTOBALINA BATISTA TAVARES": ["1249.pdf", "1249A.pdf", "1249B.pdf", "1267.pdf", "1267A.pdf", "1267B.pdf", "1267C.pdf", "1310.pdf", "1310A.pdf", "1362B.pdf"],
    "00416 - ESCUELA BASICA CURAZAO": ["1677.pdf", "1677A.pdf", "1677B.pdf", "1742.pdf", "1761.pdf", "1820.pdf", "1860.pdf", "1905.pdf"],
    "00459 - UNIVERSIDAD UTESA": ["1688.pdf", "1743.pdf", "1765.pdf", "1790.pdf", "1824.pdf", "1868.pdf", "1906.pdf"],
    "00460 - UNIV. FEDERICO HENRIQUEZ. Y CARVAJAL": ["1641A.pdf", "1641B.pdf", "1687.pdf", "1791.pdf", "1869.pdf"],
    "00529 - COLEGIO SAN ANTON": ["1814.pdf", "1891.pdf"],
    "00546 - LICEO PEDRO APONTE": ["1243.pdf", "1243A.pdf", "1243B.pdf", "1243C.pdf", "1243D.pdf", "1245B.pdf", "1246.pdf", "1246A.pdf", "1310B.pdf", "1362.pdf", "1362A.pdf", "1641.pdf", "1749.pdf"],
    // --- ZONA L ---
    "00369 - ESCUELA DE EDUCACION BASICA SAN MIGUEL": ["1631.pdf", "1701.pdf", "1741.pdf", "1760.pdf", "1819.pdf", "1859.pdf", "1904.pdf"],
    "00435 - LICEO SECUNDARIO LAS AMERICAS": ["1216.pdf", "1216A.pdf", "1216B.pdf", "1216C.pdf", "1223.pdf", "1223A.pdf", "1223B.pdf", "1223C.pdf", "1223D.pdf", "1762.pdf", "1785.pdf", "1863.pdf"],
    "00490 - ESCUELA BASICA JAPON": ["1703.pdf", "1734.pdf", "1744.pdf", "1771.pdf", "1811.pdf", "1841.pdf", "1874.pdf", "1907.pdf"],
    // --- ZONA M ---
    "00365 - ESCUELA BASICA JAMAICA": ["1215.pdf", "1215A.pdf", "1630.pdf", "1902.pdf"],
    "00511 - CENTRO EDUC. INDEPENDENCIA": ["1745.pdf", "1880.pdf"],
    "00542 - ESCUELA BASICA NUESTRA SEÑORA DE LAS MERCEDES": ["1829.pdf"],
    "00544 - LICEO ADELAIDA ACOSTA": ["1320.pdf", "1320A.pdf", "1320B.pdf", "1702.pdf", "1740.pdf", "1755.pdf", "1794.pdf", "1845.pdf", "1856.pdf", "1873.pdf"],
    // --- ZONA N ---
    "00364 - CENTRO EDUCATIVO ROSA EVANGELINA SOLANO": ["1221.pdf", "1221A.pdf", "1221B.pdf", "1222.pdf", "1222A.pdf", "1737.pdf", "1754.pdf", "1808.pdf", "1843.pdf", "1855.pdf", "1901.pdf"],
    "00502 - ESCUELA PRIMARIA ELIZARDO TAMAREZ SANTAMARIA": ["1723.pdf", "1775.pdf"],
    "00538 - LICEO PROFESOR VICTOR PASCUAL AGUERO": ["1896.pdf"],
    "00541 - ESCUELA BASICA CONCEPCION BONA": ["1835.pdf", "1878.pdf"],
    // --- ZONA O ---
    "00367 - MANOGUAYABO": ["1224.pdf", "1224A.pdf", "1224B.pdf", "1225.pdf", "1225A.pdf", "1633.pdf", "1724.pdf", "1758.pdf", "1809.pdf", "1858.pdf"],
    "00435 - LICEO SECUNDARIO LAS AMERICAS": ["1216.pdf", "1216A.pdf", "1216B.pdf", "1216C.pdf", "1223.pdf", "1223A.pdf", "1223B.pdf", "1223C.pdf", "1223D.pdf", "1762.pdf", "1785.pdf", "1863.pdf"],
    "00516 - COLEGIO INFANTIL LOS QUERUBINES": ["1777.pdf"],
    "00525 - COLEGIO TRAZO DE COLORES": ["1803.pdf", "1889.pdf"],
    // --- ZONA P ---
    "00001 - COLEGIO EL ANGEL": ["0001.pdf", "1748.pdf", "1806.pdf", "1847.pdf", "1899.pdf"],
    "00356 - COLEGIO JUAN 23": ["1234.pdf", "1234A.pdf", "1235.pdf", "1235A.pdf", "1235B.pdf", "1384.pdf", "1384A.pdf", "1485.pdf", "1485A.pdf", "1485B.pdf"],
    "00358 - ESCUELA PRIMARIA EMMA BALAGUER DE VALLEJO": ["1306.pdf", "1306A.pdf", "1307.pdf", "1307A.pdf", "1333.pdf", "1333A.pdf", "1333B.pdf", "1357.pdf", "1357A.pdf", "1357B.pdf", "1391.pdf", "1391A.pdf", "1418.pdf", "1418A.pdf", "1418B.pdf", "1635.pdf", "1635A.pdf", "1636.pdf", "1636A.pdf", "1637.pdf"],
    // --- ZONA Q ---
    "00425 - ESCUELA BASICA LAS PALMAS #1": ["1403.pdf", "1403A.pdf", "1403B.pdf", "1483.pdf", "1483A.pdf", "1483B.pdf", "1484.pdf", "1484A.pdf", "1484B.pdf"],
    "00487 - ESCUELA VEDRUNA": ["1231.pdf", "1231A.pdf", "1231B.pdf", "1231C.pdf", "1262.pdf", "1262A.pdf"],
    "00492 - COLEGIO SANTA MARIA": ["1705.pdf", "1772.pdf", "1812.pdf", "1837.pdf", "1875.pdf", "1908.pdf"],
    "00524 - CLUB ESCUELA BASICA FRANCISCO A. CAAMAÑO": ["1686.pdf", "1802.pdf", "1888.pdf"],
    // --- ZONA R ---
    "00361 - ESCUELA ING. AGR. IVAN GUZMAN K": ["1375.pdf", "1375A.pdf", "1375B.pdf", "1375C.pdf", "1375D.pdf", "1375E.pdf"],
    "00455 - EXTENSION DE LA UASD": ["1375F.pdf", "1692.pdf", "1710.pdf", "1753.pdf", "1763.pdf", "1810.pdf", "1833.pdf", "1853.pdf", "1865.pdf"],
    "00515 - HOSPITAL MUNICIPAL DE ENGOMBE": ["1725.pdf", "1840.pdf"],
    // --- ZONA S ---
    "00362 - ESCUELA PRIMARIA BUENOS AIRES": ["1236.pdf", "1236A.pdf", "1237.pdf", "1237A.pdf", "1279.pdf", "1279A.pdf", "1282.pdf", "1282A.pdf", "1284.pdf", "1284A.pdf", "1284B.pdf", "1284C.pdf", "1638.pdf"],
    "00454 - CLUB 16 DE AGOSTO": ["1638A.pdf", "1638B.pdf", "1693.pdf", "1787.pdf", "1864.pdf"],
    "00543 - ESCUELA PROFESOR JUAN BOSCH GAVIÑO": ["1486.pdf", "1486A.pdf", "1487.pdf", "1487A.pdf", "1488.pdf", "1488A.pdf"],
    // --- ZONA T ---
    "00338 - COMEDOR ECONOMICO": ["1329.pdf", "1329A.pdf", "1329B.pdf", "1370.pdf", "1370A.pdf", "1370B.pdf", "1849.pdf"],
    "00476 - ASOCIACION DE IMPEDIDO FISICO MOTORES": ["1309.pdf", "1309A.pdf", "1309B.pdf", "1309C.pdf", "1695.pdf", "1767.pdf", "1828.pdf", "1832.pdf"],
    "00526 - POLITECNICO MADRE RAFAELA IBARRA": ["1314.pdf", "1314A.pdf", "1314B.pdf", "1314C.pdf", "1314D.pdf", "1314E.pdf", "1314F.pdf", "1696.pdf", "1769.pdf", "1804.pdf", "1890.pdf"],
    // --- ZONA U ---
    "00513 - ESCUELA BASICA HERMANAS MIRABAL": ["1747.pdf", "1796.pdf", "1839.pdf", "1882.pdf"],
    // --- ZONA W ---
    "00518 - PROYECTO DESARROLLO COMUNITARIO INTEGRAL": ["1727.pdf", "1780.pdf"],
    "00534 - SALON MULTIUSO EL ABANICO": ["1799.pdf", "1830.pdf", "1893.pdf"],
    // --- ZONA X ---
    "00510 - ESCUELA DE EDUCACION BASICA PROF. JUAN GABINO": ["1736.pdf", "1779.pdf", "1879.pdf"],
    // --- ZONA Y ---
    "00474 - ESCUELA PRIMARI ERCILIA PEPIN BATEY BIENVENIDO": ["1676.pdf", "1739.pdf", "1766.pdf", "1836.pdf", "1870.pdf"],
    // --- ZONA Z ---
    "00368 - CENTRO EDUCATIVO ALBERTO PEREZ Y SANTIAGO": ["1219.pdf", "1219A.pdf", "1220.pdf", "1220A.pdf", "1759.pdf", "1834.pdf", "1903.pdf"],
    // --- ZONA Ñ ---
    "00308 - SINDICATO UNIDO DE TRAB. PORTUARIO": ["1257.pdf", "1257A.pdf", "1356.pdf"],
    "00453 - ESCUELA PADRE MARTIN EGUSQUIZA": ["1356A.pdf", "1645.pdf", "1698.pdf", "1786.pdf"],
};
// Nota: Los archivos PDF referenciados deben estar ubicados en la estructura de carpetas correspondiente para su correcta asociación.