import AppKit
import PDFKit
let args = CommandLine.arguments
let src = try String(contentsOfFile: args[1], encoding: .utf8)
let page = NSRect(x: 0, y: 0, width: 595.28, height: 841.89)
let paper = NSView(frame: page)
let body = NSTextView(frame: NSRect(x: 39, y: 44, width: 517, height: 750))
body.textContainerInset = .zero
body.textContainer?.lineFragmentPadding = 0
body.drawsBackground = false
let content = NSMutableAttributedString()
for row in src.split(separator: "\n") {
    let segments = row.split(separator: "\t", maxSplits: 1)
    let role = String(segments[0])
    let line = String(segments[1])
    let title = role == "name", heading = role == "heading", position = role == "position"
    let font = NSFont.systemFont(ofSize: title ? 34 : heading ? 10.4 : position ? 10.4 : 9.3,
                                 weight: title || heading || position ? .semibold : .regular)
    let style = NSMutableParagraphStyle()
    style.paragraphSpacingBefore = heading ? 10 : 0
    style.paragraphSpacing = title ? 7 : position || heading ? 3 : 2
    style.lineSpacing = 0.6
    let color = heading ? NSColor(srgbRed: 0.04, green: 0.34, blue: 0.34, alpha: 1) : NSColor.black
    content.append(NSAttributedString(string: line + "\n", attributes: [.font: font, .foregroundColor: color, .paragraphStyle: style]))
}
body.textStorage?.setAttributedString(content)
paper.addSubview(body)
body.layoutManager?.ensureLayout(for: body.textContainer!)
let used = body.layoutManager!.usedRect(for: body.textContainer!)
precondition(used.height < body.bounds.height, "CV trop haut : \(used.height)")
let data = paper.dataWithPDF(inside: page)
let pdf = PDFDocument(data: data)!
precondition(pdf.pageCount == 1 && pdf.string!.contains("Raphaël Flipo"))
try data.write(to: URL(fileURLWithPath: args[2]))
print(pdf.pageCount, used.height, pdf.string!.prefix(110))
