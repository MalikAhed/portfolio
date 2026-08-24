"""Convert the image-model-generated shadow plate into a web alpha overlay."""

from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "references/generated-window-shadow-two-section-plate.png"
OUTPUT = ROOT / "assets/source-art/window-shadow-two-section.png"
PREVIEW = ROOT / "assets/source-art/window-shadow-two-section-preview.jpg"

TARGET_SIZE = (1672, 1882)
CANVAS = (245, 240, 232)
SHADOW = (55, 49, 43)


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


plate = Image.open(SOURCE).convert("RGB").resize(
    TARGET_SIZE, Image.Resampling.LANCZOS
)
alpha = Image.new("L", TARGET_SIZE, 0)
plate_pixels = plate.load()
alpha_pixels = alpha.load()

for y in range(TARGET_SIZE[1]):
    progress = y / (TARGET_SIZE[1] - 1)
    # The generated plate already fades naturally. This final-quarter envelope
    # guarantees true zero alpha at the lower edge without changing geometry.
    final_fade = 1.0 - smoothstep((progress - 0.72) / 0.28)
    for x in range(TARGET_SIZE[0]):
        pixel = plate_pixels[x, y]
        channel_alpha = [
            (background - value) / max(1, background - shadow)
            for value, background, shadow in zip(pixel, CANVAS, SHADOW)
        ]
        opacity = max(0.0, min(1.0, sum(channel_alpha) / 3.0))
        alpha_pixels[x, y] = round(255 * opacity * final_fade)

alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.7))
alpha.paste(Image.new("L", (TARGET_SIZE[0], 1), 0), (0, TARGET_SIZE[1] - 1))

output = Image.new("RGBA", TARGET_SIZE, (*SHADOW, 0))
output.putalpha(alpha)
output.save(OUTPUT, optimize=True)

preview = Image.new("RGBA", TARGET_SIZE, (*CANVAS, 255))
preview.alpha_composite(output)
preview.convert("RGB").resize(
    (836, 941), Image.Resampling.LANCZOS
).save(PREVIEW, quality=92, optimize=True)

print(OUTPUT)
