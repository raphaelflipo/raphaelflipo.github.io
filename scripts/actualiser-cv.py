"""Synchronise les libellés des CV Word avec les CV web."""
from pathlib import Path
from zipfile import ZipFile
import re

CV = Path(__file__).resolve().parents[1] / "cv"
CHANGES = {
    "Assistant commercial et responsable marketing": "Assistant commercial et marketing",
    "Sales Assistant and Marketing Manager": "Sales and Marketing Assistant",
    "Piloter des projets marketing internes": "Participer aux projets marketing internes",
    "Lead internal marketing projects": "Contribute to internal marketing projects",
}

for path in CV.glob("*.docx"):
    tmp = path.with_suffix(".tmp")
    with ZipFile(path) as source, ZipFile(tmp, "w") as target:
        for member in source.infolist():
            data = source.read(member)
            if member.filename.startswith("word/") and member.filename.endswith(".xml"):
                value = data.decode()
                for old, new in CHANGES.items():
                    value = value.replace(old, new)
                value = re.sub(r"Tennis\s*\((?:classement|French ranking) 2/6\)", "Tennis", value, flags=re.I)
                data = value.encode()
            target.writestr(member, data)
    tmp.replace(path)
