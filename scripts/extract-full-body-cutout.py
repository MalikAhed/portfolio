"""Extract the grayscale portrait from a green-key source plate."""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "assets/source-art/malik-cutout-full-body.png"


def extract_cutout(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        source = source_image.convert("RGB")

    red, green, blue = source.split()

    # The source plate uses saturated green only as a deterministic key. Green
    # dominance is near 255 in the background and near zero on the grayscale
    # subject. Mapping that separation to alpha avoids a green edge fringe.
    dominance = Image.new("L", source.size)
    dominance.putdata(
        [
            max(0, g - max(r, b))
            for r, g, b in zip(red.getdata(), green.getdata(), blue.getdata())
        ]
    )
    alpha = dominance.point(
        lambda value: (
            0
            if value >= 220
            else 255
            if value <= 80
            else round((220 - value) * 255 / 140)
        )
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.45))
    alpha = alpha.point(lambda value: 0 if value < 24 else value)

    gray = source.convert("L")
    output = Image.merge("RGBA", (gray, gray, gray, alpha))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, optimize=True)


def main() -> None:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Green-key source plate")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output PNG (default: {DEFAULT_OUTPUT})",
    )
    arguments = parser.parse_args()
    extract_cutout(arguments.source, arguments.output)
    print(arguments.output)


if __name__ == "__main__":
    main()
