from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

WIDTH, HEIGHT = 1200, 630
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "camping-checklist-social-preview-v1.jpg"
FONT_REGULAR = "C:/Windows/Fonts/NotoSansKR-VF.ttf"
FONT_BOLD = "C:/Windows/Fonts/malgunbd.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


image = Image.new("RGB", (WIDTH, HEIGHT), "#173f35")
draw = ImageDraw.Draw(image)

# Deep forest gradient.
for y in range(HEIGHT):
    ratio = y / HEIGHT
    color = tuple(int(a + (b - a) * ratio) for a, b in zip((23, 63, 53), (10, 34, 30)))
    draw.line((0, y, WIDTH, y), fill=color)

# Moon glow and subtle stars.
for radius, alpha in [(170, 18), (125, 24), (82, 38)]:
    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((990-radius, 95-radius, 990+radius, 95+radius), fill=(217, 255, 97, alpha))
    image = Image.alpha_composite(image.convert("RGBA"), glow)
draw = ImageDraw.Draw(image)
draw.ellipse((954, 58, 1026, 130), fill="#d9ff61")
for x, y, r in [(744, 60, 3), (824, 112, 2), (1098, 178, 3), (690, 180, 2), (1140, 72, 2)]:
    draw.ellipse((x-r, y-r, x+r, y+r), fill="#fffdf0")

# Mountain silhouettes.
draw.polygon([(620, 420), (760, 238), (900, 420)], fill="#315c4e")
draw.polygon([(765, 420), (955, 205), (1165, 420)], fill="#294d42")
draw.polygon([(920, 420), (1085, 270), (1200, 390), (1200, 460)], fill="#22483d")
draw.polygon([(720, 290), (760, 238), (800, 290), (770, 278), (750, 300)], fill="#f8f7f0")
draw.polygon([(905, 262), (955, 205), (1008, 263), (969, 247), (946, 274)], fill="#f8f7f0")

# Ground.
draw.ellipse((565, 385, 1280, 710), fill="#102f29")

# Left copy.
draw.text((72, 66), "CAMPING CHECKLIST", font=font(25, True), fill="#d9ff61")
draw.text((72, 122), "빠뜨림 없는", font=font(64, True), fill="#fffdf7")
draw.text((72, 205), "캠핑 준비", font=font(64, True), fill="#fffdf7")
draw.text((75, 310), "유형 · 일정 · 인원에 맞춘 준비물 자동 추천", font=font(25), fill="#dbe8e2")

# Feature pills.
rounded(draw, (72, 376, 273, 430), 27, "#d9ff61")
draw.text((103, 389), "전체 기본 선택", font=font(20, True), fill="#173f35")
rounded(draw, (287, 376, 500, 430), 27, "#fffdf7")
draw.text((318, 389), "PDF · XLSX 저장", font=font(20, True), fill="#173f35")

# Brand note.
draw.text((75, 525), "homong-app.com", font=font(20, True), fill="#9fb8ad")

# Tent illustration.
draw.polygon([(705, 525), (828, 332), (954, 525)], fill="#ff7445")
draw.polygon([(828, 332), (828, 525), (954, 525)], fill="#df5635")
draw.polygon([(789, 525), (828, 424), (869, 525)], fill="#173f35")
draw.line((684, 525, 975, 525), fill="#d9ff61", width=7)

# Compact checklist card on the right.
shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle((887, 250, 1154, 542), radius=28, fill=(0, 0, 0, 55))
image = Image.alpha_composite(image, shadow)
draw = ImageDraw.Draw(image)
rounded(draw, (872, 232, 1139, 524), 28, "#fffdf7")
draw.text((902, 261), "나의 캠핑 준비", font=font(24, True), fill="#173f35")
draw.text((902, 301), "선택한 준비물  42 / 42", font=font(15), fill="#68756f")
draw.rounded_rectangle((902, 332, 1109, 341), radius=5, fill="#dce5dd")
draw.rounded_rectangle((902, 332, 1109, 341), radius=5, fill="#d9ff61")
for index, label in enumerate(["텐트", "침낭", "랜턴", "버너"]):
    y = 374 + index * 34
    rounded(draw, (902, y, 923, y + 21), 6, "#173f35")
    draw.line((908, y + 11, 913, y + 16, 920, y + 7), fill="#d9ff61", width=3)
    draw.text((936, y - 3), label, font=font(17, True), fill="#263b34")

# Warm campfire in front.
for dx, dy in [(-18, 0), (18, 0)]:
    draw.line((760 + dx, 558 + dy, 820 + dx, 583 + dy), fill="#a66b3d", width=12)
draw.ellipse((755, 543, 831, 605), fill="#ffb238")
draw.polygon([(793, 579), (772, 551), (794, 512), (813, 552)], fill="#ff7445")
draw.polygon([(794, 573), (785, 551), (797, 531), (806, 554)], fill="#fff0a5")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
image.convert("RGB").save(OUTPUT, "JPEG", quality=92, optimize=True, progressive=True)
print(OUTPUT)
