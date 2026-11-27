import sys, re
from zipfile import ZipFile
import xml.etree.ElementTree as ET
with ZipFile(sys.argv[1]) as z:
 root=ET.fromstring(z.read("word/document.xml"))
 ns={"w":"http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
 for p in root.findall(".//w:p", ns):
  s="".join(t.text or "" for t in p.findall(".//w:t",ns)).strip()
  if not s: continue
  assert not re.search(r"responsable marketing|marketing manager|2/6",s,re.I),s
  kind="name" if s=="Raphaël Flipo" else "heading" if s.isupper() and len(s)>4 else "position" if s in ("Assistant commercial et marketing","Sales and Marketing Assistant") else "text"
  print(kind+"\t"+s)
