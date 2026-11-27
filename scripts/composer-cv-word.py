"""Compose a single-column A4 Word résumé from the validated résumé text."""
from pathlib import Path
import sys
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile

source, destination = map(Path, sys.argv[1:3])
namespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
paragraphs = []
for row in source.read_text().splitlines():
    role, content = row.split("\t", 1)
    size, before, after, colour = {
        "name": (62, 0, 130, "17252B"),
        "heading": (22, 160, 60, "095757"),
        "position": (22, 40, 65, "17252B"),
        "text": (19, 0, 46, "17252B"),
    }[role]
    heading = '<w:outlineLvl w:val="0"/>' if role == "heading" else ""
    keep = "<w:keepNext/>" if role in {"heading", "name", "position"} else ""
    bold = "<w:b/>" if role != "text" else ""
    paragraphs.append(
        f'<w:p><w:pPr>{keep}<w:spacing w:before="{before}" w:after="{after}"/>'
        f'{heading}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'
        f'{bold}<w:color w:val="{colour}"/><w:sz w:val="{size}"/></w:rPr>'
        f'<w:t xml:space="preserve">{escape(content)}</w:t></w:r></w:p>'
    )
section = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="900" w:right="850" w:bottom="900" w:left="850" w:header="450" w:footer="450" w:gutter="0"/></w:sectPr>'
document = f'<w:document xmlns:w="{namespace}"><w:body>{"".join(paragraphs)}{section}</w:body></w:document>'
with ZipFile(destination, "w", compression=ZIP_DEFLATED) as package:
    package.writestr("[Content_Types].xml", '''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>''')
    package.writestr("_rels/.rels", '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>''')
    package.writestr("word/document.xml", document)
