#!/usr/bin/env python3
"""Build a tiny project-local bentOS logo font.

This is intentionally not a general-purpose typeface. It starts with the six
glyphs needed for the boot logo and gives us deterministic outlines/metrics to
iterate against the CRT reference.
"""

from __future__ import annotations

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen


UNITS = 1000
ASCENDER = 880
DESCENDER = -160
FONT_REVISION = 14


def glyph_from_contours(contours: list[list[tuple[int, int]]]):
    pen = TTGlyphPen(None)
    for contour in contours:
        pen.moveTo(contour[0])
        for pt in contour[1:]:
            pen.lineTo(pt)
        pen.closePath()
    return pen.glyph()


def signed_area(points: list[tuple[int, int]]) -> int:
    return sum(
        (points[(i + 1) % len(points)][0] - points[i][0])
        * (points[(i + 1) % len(points)][1] + points[i][1])
        for i in range(len(points))
    )


def clockwise(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    return points if signed_area(points) > 0 else list(reversed(points))


def counter(points: list[tuple[int, int]]) -> list[tuple[int, int]]:
    return points if signed_area(points) < 0 else list(reversed(points))


def rect(x0: int, y0: int, x1: int, y1: int) -> list[tuple[int, int]]:
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def chamfer_rect(x0: int, y0: int, x1: int, y1: int, cut: int) -> list[tuple[int, int]]:
    return [
        (x0 + cut, y0),
        (x1 - cut, y0),
        (x1, y0 + cut),
        (x1, y1 - cut),
        (x1 - cut, y1),
        (x0 + cut, y1),
        (x0, y1 - cut),
        (x0, y0 + cut),
    ]


def build_font(out_path: Path) -> None:
    glyph_order = [".notdef", "space", "b", "e", "n", "t", "O", "S"]
    glyphs = {}
    advance = {}

    glyphs[".notdef"] = glyph_from_contours([clockwise(rect(80, 0, 520, 700)), counter(rect(160, 90, 440, 610))])
    advance[".notdef"] = 600
    glyphs["space"] = glyph_from_contours([])
    advance["space"] = 320

    glyphs["b"] = glyph_from_contours(
        [
            clockwise(
                [
                    (35, 0),
                    (35, 820),
                    (142, 820),
                    (142, 520),
                    (488, 520),
                    (584, 424),
                    (584, 96),
                    (488, 0),
                ]
            ),
            counter([(142, 148), (388, 148), (462, 222), (462, 304), (388, 378), (142, 378)]),
        ]
    )
    advance["b"] = 640

    glyphs["e"] = glyph_from_contours(
        [
            clockwise(
                [
                    (54, 104),
                    (158, 0),
                    (520, 0),
                    (612, 92),
                    (612, 170),
                    (174, 170),
                    (174, 132),
                    (510, 132),
                    (612, 234),
                    (612, 424),
                    (508, 528),
                    (158, 528),
                    (54, 424),
                ]
            ),
            counter([(174, 300), (440, 300), (486, 346), (440, 392), (174, 392)]),
        ]
    )
    advance["e"] = 640

    glyphs["n"] = glyph_from_contours(
        [
            clockwise(
                [
                    (35, 0),
                    (35, 520),
                    (452, 520),
                    (580, 392),
                    (580, 0),
                    (450, 0),
                    (450, 326),
                    (386, 390),
                    (164, 390),
                    (164, 0),
                ]
            )
        ]
    )
    advance["n"] = 638

    glyphs["t"] = glyph_from_contours(
        [
            clockwise(
                [
                    (210, 0),
                    (210, 394),
                    (34, 394),
                    (35, 528),
                    (210, 528),
                    (210, 730),
                    (338, 730),
                    (338, 528),
                    (578, 528),
                    (578, 394),
                    (338, 394),
                    (338, 146),
                    (392, 92),
                    (574, 92),
                    (574, 0),
                ]
            )
        ]
    )
    advance["t"] = 592

    glyphs["O"] = glyph_from_contours(
        [
            clockwise(
                [
                    (98, 0),
                    (0, 98),
                    (0, 604),
                    (98, 702),
                    (608, 702),
                    (706, 604),
                    (706, 98),
                    (608, 0),
                ]
            ),
            counter([(126, 116), (580, 116), (590, 126), (590, 576), (580, 586), (126, 586), (116, 576), (116, 126)]),
        ]
    )
    advance["O"] = 732

    glyphs["S"] = glyph_from_contours(
        [
            clockwise(
                [
                    (100, 0),
                    (0, 100),
                    (0, 184),
                    (128, 184),
                    (128, 150),
                    (168, 110),
                    (490, 110),
                    (536, 156),
                    (536, 238),
                    (490, 284),
                    (110, 284),
                    (0, 394),
                    (0, 590),
                    (104, 694),
                    (568, 694),
                    (680, 582),
                    (680, 504),
                    (552, 504),
                    (552, 540),
                    (512, 580),
                    (182, 580),
                    (128, 528),
                    (128, 466),
                    (182, 412),
                    (566, 412),
                    (680, 298),
                    (680, 110),
                    (568, 0),
                ]
            )
        ]
    )
    advance["S"] = 702

    fb = FontBuilder(UNITS, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap({32: "space", 98: "b", 101: "e", 110: "n", 116: "t", 79: "O", 83: "S"})
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({name: (advance[name], 0) for name in glyph_order})
    fb.setupHorizontalHeader(ascent=ASCENDER, descent=DESCENDER)
    fb.setupOS2(
        sTypoAscender=ASCENDER,
        sTypoDescender=DESCENDER,
        usWinAscent=ASCENDER,
        usWinDescent=abs(DESCENDER),
    )
    fb.setupNameTable(
        {
            "familyName": "bentOS Logo Lab",
            "styleName": "Regular",
            "uniqueFontIdentifier": f"bentOS Logo Lab Regular 0.{FONT_REVISION}",
            "fullName": f"bentOS Logo Lab Regular {FONT_REVISION}",
            "psName": f"bentOSLogoLab-Regular-{FONT_REVISION}",
            "version": f"Version 0.{FONT_REVISION}",
        }
    )
    fb.setupPost()
    fb.setupMaxp()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fb.save(out_path)


if __name__ == "__main__":
    build_font(Path(f"public/fonts/bentos-logo-r{FONT_REVISION}.ttf"))
    build_font(Path("public/fonts/bentos-logo.ttf"))
    print(f"Wrote public/fonts/bentos-logo-r{FONT_REVISION}.ttf and public/fonts/bentos-logo.ttf")
