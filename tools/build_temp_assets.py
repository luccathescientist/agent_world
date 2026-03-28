from __future__ import annotations

from pathlib import Path
import json

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parent.parent
SPRITES_DIR = ROOT / "assets" / "sprites"
TILES_DIR = ROOT / "assets" / "tiles"
SOURCE_SHEET = ROOT / "lucca.png"
OFFICE_TILESET_DIR = ROOT / "assets" / "tiles" / "office_tileset" / "Office Tileset"
OFFICE_SHEET_1 = OFFICE_TILESET_DIR / "Office VX Ace" / "B-C-D-E Office 1 No Shadows.png"
OFFICE_SHEET_2 = OFFICE_TILESET_DIR / "Office VX Ace" / "B-C-D-E Office 2 No Shadows.png"


def ensure_dirs() -> None:
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    TILES_DIR.mkdir(parents=True, exist_ok=True)


def draw_rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill: tuple[int, int, int], outline: tuple[int, int, int] | None = None) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=fill, outline=outline)


def crop_box(img: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return img.crop(box).convert("RGBA")


def trim_alpha(img: Image.Image) -> Image.Image:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    return img.crop(bbox) if bbox else img


def paste(img: Image.Image, crop: Image.Image, x: int, y: int, scale: int = 1) -> None:
    if scale != 1:
        crop = crop.resize((crop.width * scale, crop.height * scale), Image.Resampling.NEAREST)
    img.alpha_composite(crop, (x, y))


def tile_fill(img: Image.Image, tile: Image.Image, x: int, y: int, w: int, h: int, scale: int = 2) -> None:
    tile = tile.resize((tile.width * scale, tile.height * scale), Image.Resampling.NEAREST)
    for oy in range(y, y + h, tile.height):
        for ox in range(x, x + w, tile.width):
            img.alpha_composite(tile, (ox, oy))


def region(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return trim_alpha(crop_box(sheet, box))


def tile_region(sheet: Image.Image, left: int, top: int, right: int, bottom: int, tile_size: int = 32) -> Image.Image:
    return region(sheet, (left * tile_size, top * tile_size, right * tile_size, bottom * tile_size))


def add_shadow(img: Image.Image, x: int, y: int, w: int, h: int, color: tuple[int, int, int, int] = (33, 44, 63, 84)) -> None:
    shadow = Image.new("RGBA", (w, h), color)
    img.alpha_composite(shadow, (x, y))


def draw_office_shell(draw: ImageDraw.ImageDraw) -> None:
    draw_rect(draw, 0, 0, 960, 600, (52, 45, 43))
    draw_rect(draw, 26, 26, 908, 548, (240, 237, 231), (68, 63, 74))
    draw_rect(draw, 40, 40, 880, 146, (244, 241, 235))
    draw_rect(draw, 40, 188, 880, 346, (161, 190, 194))
    draw_rect(draw, 40, 172, 880, 14, (120, 112, 101))
    draw_rect(draw, 40, 532, 880, 18, (242, 239, 232))
    draw_rect(draw, 466, 40, 30, 120, (255, 255, 255))
    for x in range(40, 920, 40):
        draw.line((x, 188, x, 534), fill=(133, 166, 171), width=2)
    for y in range(188, 536, 40):
        draw.line((40, y, 920, y), fill=(133, 166, 171), width=2)
    for x in range(-220, 980, 44):
        draw.line((x, 188, x + 280, 468), fill=(141, 176, 181), width=2)
        draw.line((x + 280, 188, x, 468), fill=(141, 176, 181), width=2)
    draw_rect(draw, 374, 40, 212, 94, (229, 226, 220), (79, 74, 80))
    draw_rect(draw, 70, 52, 166, 70, (233, 230, 224), (79, 74, 80))
    draw_rect(draw, 716, 52, 152, 70, (233, 230, 224), (79, 74, 80))
    draw_rect(draw, 214, 398, 172, 110, (239, 236, 230), (79, 74, 80))
    draw_rect(draw, 672, 380, 214, 126, (238, 235, 229), (79, 74, 80))


def draw_panel_border(img: Image.Image) -> None:
    panel = Image.new("RGBA", img.size, (0, 0, 0, 0))
    panel_draw = ImageDraw.Draw(panel)
    panel_draw.rectangle((0, 0, img.width - 1, img.height - 1), outline=(255, 255, 255, 18))
    img.alpha_composite(panel)


def draw_room_background() -> None:
    bg = Image.new("RGBA", (960, 600), (0, 0, 0, 0))
    fg = Image.new("RGBA", (960, 600), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)
    draw_office_shell(draw)

    office1 = Image.open(OFFICE_SHEET_1).convert("RGBA")
    office2 = Image.open(OFFICE_SHEET_2).convert("RGBA")

    window_single = tile_region(office2, 1, 5, 3, 6)
    window_double = tile_region(office2, 3, 5, 5, 6)
    window_triple = tile_region(office2, 5, 5, 7, 6)
    clock = tile_region(office2, 0, 7, 1, 8)
    frame_landscape = tile_region(office2, 0, 9, 2, 10)
    frame_chart = tile_region(office2, 1, 11, 4, 12)
    frame_notice = tile_region(office2, 5, 9, 6, 10)
    plant_small = tile_region(office2, 2, 12, 3, 13)
    plant_tall = tile_region(office2, 4, 12, 6, 14)
    rug_blue = tile_region(office2, 4, 14, 6, 15)
    rug_gold = tile_region(office2, 0, 15, 2, 16)
    small_round_table = tile_region(office2, 0, 2, 1, 3)
    long_table_wood = tile_region(office2, 3, 3, 6, 4)
    long_table_grey = tile_region(office2, 6, 3, 9, 4)
    bench_wood = tile_region(office2, 1, 2, 2, 4)
    bench_grey = tile_region(office2, 2, 2, 3, 4)
    chair_mauve = tile_region(office2, 0, 0, 2, 1)
    chair_white = tile_region(office2, 4, 0, 6, 1)
    office_chair = tile_region(office2, 10, 10, 12, 12)
    water_cooler = tile_region(office2, 8, 0, 10, 2)
    storage = tile_region(office2, 11, 1, 13, 3)
    coffee_machine = tile_region(office2, 8, 11, 10, 12)
    phone = tile_region(office2, 12, 4, 13, 5)
    mugs = tile_region(office2, 13, 3, 16, 4)
    crt_green = tile_region(office2, 8, 7, 10, 8)
    crt_blue = tile_region(office2, 10, 7, 12, 8)
    flatscreen = tile_region(office2, 12, 7, 14, 8)
    desktop_bottom = tile_region(office2, 8, 8, 14, 9)
    laptop_pair = tile_region(office2, 8, 9, 12, 10)
    divider = tile_region(office2, 12, 8, 13, 9)
    terminal_tall = tile_region(office1, 13, 2, 16, 6)
    shelf_short = tile_region(office1, 8, 7, 11, 8)
    shelf_tall = tile_region(office1, 12, 12, 16, 14)
    cabinet_bank = tile_region(office1, 8, 14, 14, 16)

    # Windows and wall dressing.
    paste(bg, window_double, 104, 60, scale=2)
    paste(bg, window_triple, 402, 56, scale=2)
    paste(bg, window_double, 744, 60, scale=2)
    paste(bg, frame_landscape, 246, 82, scale=2)
    paste(bg, frame_chart, 532, 74, scale=2)
    paste(bg, frame_notice, 810, 80, scale=2)
    paste(bg, clock, 264, 54, scale=2)
    paste(bg, clock, 654, 54, scale=2)

    # Library anchor.
    add_shadow(bg, 82, 128, 192, 22)
    paste(bg, terminal_tall, 78, 92, scale=2)
    paste(bg, shelf_tall, 168, 118, scale=2)
    paste(bg, plant_small, 76, 162, scale=2)
    add_shadow(bg, 114, 232, 160, 18)
    paste(bg, long_table_grey, 108, 196, scale=2)
    paste(bg, laptop_pair, 140, 178, scale=2)
    paste(bg, chair_white, 122, 250, scale=2)
    paste(bg, rug_gold, 114, 410, scale=2)
    paste(bg, bench_grey, 76, 466, scale=2)

    # Comms anchor.
    add_shadow(bg, 736, 126, 154, 22)
    paste(bg, storage, 748, 96, scale=2)
    paste(bg, water_cooler, 812, 96, scale=2)
    paste(bg, coffee_machine, 744, 168, scale=2)
    paste(bg, phone, 822, 176, scale=2)
    paste(bg, mugs, 852, 174, scale=2)
    paste(bg, plant_small, 838, 246, scale=2)
    paste(bg, frame_notice, 730, 74, scale=2)

    # Terminal anchor.
    terminal_desks = (
        (266, 234, long_table_wood, crt_green, chair_mauve),
        (472, 234, long_table_wood, crt_blue, chair_mauve),
        (266, 344, long_table_wood, flatscreen, chair_mauve),
        (472, 344, long_table_wood, crt_blue, chair_mauve),
    )
    for x, y, desk, monitor, chair in terminal_desks:
        add_shadow(bg, x + 4, y + 48, 144, 22)
        paste(bg, desk, x, y, scale=2)
        paste(bg, monitor, x + 36, y - 18, scale=2)
        paste(bg, desktop_bottom, x + 26, y + 6, scale=2)
        paste(bg, chair, x + 36, y + 74, scale=2)
    paste(bg, divider, 438, 224, scale=2)
    paste(bg, divider, 438, 334, scale=2)
    paste(bg, frame_chart, 368, 92, scale=2)

    # Desk anchor.
    add_shadow(bg, 192, 434, 180, 22)
    paste(bg, long_table_wood, 206, 392, scale=2)
    paste(bg, laptop_pair, 238, 374, scale=2)
    paste(bg, chair_white, 230, 466, scale=2)
    paste(bg, bench_wood, 122, 452, scale=2)
    paste(bg, plant_tall, 338, 392, scale=2)
    paste(bg, frame_chart, 188, 414, scale=2)

    # Lounge anchor.
    paste(bg, rug_blue, 700, 414, scale=2)
    add_shadow(bg, 714, 452, 160, 18)
    paste(bg, long_table_grey, 740, 432, scale=2)
    paste(bg, small_round_table, 806, 426, scale=2)
    paste(bg, chair_mauve, 706, 476, scale=2)
    paste(bg, chair_mauve, 834, 476, scale=2)
    paste(bg, bench_grey, 692, 490, scale=2)
    paste(bg, plant_tall, 842, 398, scale=2)
    paste(bg, cabinet_bank, 662, 250, scale=2)
    paste(bg, shelf_short, 690, 248, scale=2)

    # Foreground pieces for depth.
    paste(fg, long_table_wood, 266, 234, scale=2)
    paste(fg, long_table_wood, 472, 234, scale=2)
    paste(fg, long_table_wood, 206, 392, scale=2)
    paste(fg, long_table_grey, 740, 432, scale=2)
    paste(fg, bench_grey, 692, 490, scale=2)

    draw_panel_border(bg)
    bg.save(TILES_DIR / "lab_room_bg.png")
    fg.save(TILES_DIR / "lab_room_fg.png")


def build_lucca_frames() -> None:
    source = Image.open(SOURCE_SHEET).convert("RGBA")

    def sorted_sprite_rows() -> list[list[tuple[int, int, int, int]]]:
        visited: set[tuple[int, int]] = set()
        boxes: list[tuple[int, int, int, int]] = []

        def is_foreground(x: int, y: int) -> bool:
            r, g, b, _a = source.getpixel((x, y))
            return not (r > 235 and g > 235 and b > 235)

        from collections import deque

        for y in range(source.height):
            for x in range(source.width):
                if (x, y) in visited or not is_foreground(x, y):
                    continue
                queue = deque([(x, y)])
                visited.add((x, y))
                xs: list[int] = []
                ys: list[int] = []
                while queue:
                    cx, cy = queue.popleft()
                    xs.append(cx)
                    ys.append(cy)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if (
                            0 <= nx < source.width
                            and 0 <= ny < source.height
                            and (nx, ny) not in visited
                            and is_foreground(nx, ny)
                        ):
                            visited.add((nx, ny))
                            queue.append((nx, ny))
                if len(xs) > 40:
                    left, top, right, bottom = min(xs), min(ys), max(xs), max(ys)
                    if right - left < 60 and bottom - top < 60:
                        boxes.append((left, top, right + 1, bottom + 1))

        rows: list[dict[str, object]] = []
        for box in sorted(boxes, key=lambda item: (item[1], item[0])):
            y_center = (box[1] + box[3]) / 2
            for row in rows:
                if abs(row["yc"] - y_center) < 12:
                    row["boxes"].append(box)
                    row["yc"] = sum((entry[1] + entry[3]) / 2 for entry in row["boxes"]) / len(row["boxes"])
                    break
            else:
                rows.append({"yc": y_center, "boxes": [box]})

        return [sorted(row["boxes"], key=lambda item: item[0]) for row in rows]

    rows = sorted_sprite_rows()

    # User-guided rows:
    # row 0: facing down
    # row 1: facing up
    # row 3: facing right
    # row 7: shocked
    # row 10: triumph
    # row 11: resting
    frame_boxes = {
        "idle_0": rows[0][2],
        "idle_1": rows[0][3],
        "walk_0": rows[0][1],
        "walk_1": rows[0][2],
        "walk_2": rows[0][3],
        "walk_3": rows[0][2],
        "idle_down": rows[0][2],
        "idle_side": rows[3][1],
        "idle_up": rows[1][2],
        "walk_down_0": rows[0][1],
        "walk_down_1": rows[0][2],
        "walk_down_2": rows[0][3],
        "walk_side_0": rows[3][0],
        "walk_side_1": rows[3][1],
        "walk_side_2": rows[3][2],
        "walk_up_0": rows[1][1],
        "walk_up_1": rows[1][2],
        "walk_up_2": rows[1][3],
        "work_0": rows[4][0],
        "work_1": rows[4][1],
        "read_0": rows[5][0],
        "read_1": rows[5][1],
        "shocked_0": rows[7][0],
        "shocked_1": rows[7][1],
        "triumph_0": rows[10][0],
        "triumph_1": rows[10][1],
        "rest_0": rows[11][0],
        "rest_1": rows[11][1],
    }

    atlas = Image.new("RGBA", (32 * len(frame_boxes), 48), (0, 0, 0, 0))
    metadata: dict[str, dict[str, int]] = {}

    for index, (name, box) in enumerate(frame_boxes.items()):
        crop = source.crop(box).convert("RGBA")
        pixels = crop.load()
        for y in range(crop.height):
            for x in range(crop.width):
                r, g, b, a = pixels[x, y]
                if r > 235 and g > 235 and b > 235:
                    pixels[x, y] = (255, 255, 255, 0)
        frame = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
        scaled = ImageOps.contain(crop, (26, 40), method=Image.Resampling.NEAREST)
        offset_x = (32 - scaled.width) // 2
        offset_y = 48 - scaled.height - 2
        frame.alpha_composite(scaled, (offset_x, offset_y))
        atlas.alpha_composite(frame, (index * 32, 0))
        metadata[name] = {"x": index * 32, "y": 0, "w": 32, "h": 48}

    atlas.save(SPRITES_DIR / "lucca_atlas.png")
    (SPRITES_DIR / "lucca_atlas.json").write_text(json.dumps({"frames": metadata}, indent=2))


def build_robo_frames() -> None:
    source = Image.open(ROOT / "robo.png").convert("RGBA")
    frame_boxes = {
        "idle_0": (120, 680, 152, 712),
        "idle_1": (120, 720, 152, 752),
        "walk_0": (160, 680, 192, 712),
        "walk_1": (200, 680, 232, 712),
        "walk_2": (240, 680, 272, 712),
        "walk_3": (200, 680, 232, 712),
        "idle_down": (120, 680, 152, 712),
        "idle_side": (160, 720, 192, 752),
        "idle_up": (120, 800, 152, 832),
        "walk_down_0": (160, 680, 192, 712),
        "walk_down_1": (200, 680, 232, 712),
        "walk_down_2": (240, 680, 272, 712),
        "walk_side_0": (160, 720, 192, 752),
        "walk_side_1": (200, 720, 232, 752),
        "walk_side_2": (240, 720, 272, 752),
        "walk_up_0": (160, 800, 192, 832),
        "walk_up_1": (200, 800, 232, 832),
        "walk_up_2": (240, 800, 272, 832),
        "work_0": (160, 760, 192, 792),
        "work_1": (200, 760, 232, 792),
        "read_0": (240, 760, 272, 792),
        "read_1": (280, 760, 312, 792),
        "shocked_0": (280, 800, 312, 832),
        "shocked_1": (320, 800, 352, 832),
        "triumph_0": (240, 840, 272, 872),
        "triumph_1": (280, 840, 312, 872),
        "rest_0": (320, 840, 352, 872),
        "rest_1": (360, 840, 392, 872),
    }

    atlas = Image.new("RGBA", (32 * len(frame_boxes), 48), (0, 0, 0, 0))
    metadata: dict[str, dict[str, int]] = {}

    for index, (name, box) in enumerate(frame_boxes.items()):
        crop = source.crop(box).convert("RGBA")
        pixels = crop.load()
        for y in range(crop.height):
            for x in range(crop.width):
                r, g, b, a = pixels[x, y]
                if a and r < 40 and g > 100 and b > 160:
                    pixels[x, y] = (255, 255, 255, 0)
        frame = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
        scaled = ImageOps.contain(crop, (28, 42), method=Image.Resampling.NEAREST)
        offset_x = (32 - scaled.width) // 2
        offset_y = 48 - scaled.height - 2
        frame.alpha_composite(scaled, (offset_x, offset_y))
        atlas.alpha_composite(frame, (index * 32, 0))
        metadata[name] = {"x": index * 32, "y": 0, "w": 32, "h": 48}

    atlas.save(SPRITES_DIR / "robo_atlas.png")
    (SPRITES_DIR / "robo_atlas.json").write_text(json.dumps({"frames": metadata}, indent=2))


def main() -> None:
    ensure_dirs()
    draw_room_background()
    build_lucca_frames()
    build_robo_frames()


if __name__ == "__main__":
    main()
