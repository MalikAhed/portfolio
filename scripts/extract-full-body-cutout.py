from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    "/home/malikabuallatta/.codex/generated_images/"
    "01a02f1e-5ec4-7fc3-a2e9-b606ee885cb8/"
    "exec-bba588b5-086b-4c1c-81a4-b2ab81fdc552.png"
)
OUTPUT = ROOT / "public/assets/malik-cutout-full-body.png"


source = Image.open(SOURCE).convert("RGB")
red, green, blue = source.split()

# The temporary source plate uses saturated green only as a deterministic key.
# Green dominance is near 255 in the background and near zero on the grayscale
# subject. Map that separation to antialiased alpha, then keep RGB grayscale so
# no green fringe can survive in partially transparent edge pixels.
dominance = Image.new("L", source.size)
dominance.putdata(
    [
        max(0, g - max(r, b))
        for r, g, b in zip(red.getdata(), green.getdata(), blue.getdata())
    ]
)
alpha = dominance.point(
    lambda value: 0
    if value >= 220
    else 255
    if value <= 80
    else round((220 - value) * 255 / 140)
)
alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.45))
alpha = alpha.point(lambda value: 0 if value < 24 else value)

gray = source.convert("L")
output = Image.merge("RGBA", (gray, gray, gray, alpha))
output.save(OUTPUT, optimize=True)

print(OUTPUT)
