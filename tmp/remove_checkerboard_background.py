from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "IMAGE"
DEST = ROOT / "public" / "insects-original"
FILES = [
    "02_외뿔장수풍뎅이.png",
    "03_청동풍뎅이.png",
    "04_기드온장수풍뎅이.png",
    "05_흰점박이꽃무지.png",
    "06_벼룩잎벌레.png",
    "07_사시나무잎벌레.png",
    "08_중국청람색잎벌레.png",
    "21_솔수염하늘소.png",
    "23_멋쟁이딱정벌레.png",
    "24_비단벌레.png",
    "31_노랑나비.png",
    "39_토종꿀벌.png",
]


def is_background(pixel):
    r, g, b, _ = pixel
    return max(pixel[:3]) - min(pixel[:3]) <= 12 and min(pixel[:3]) >= 215


def remove_background(source_path, destination_path):
    image = Image.open(source_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    queue = deque()
    visited = bytearray(width * height)

    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        index = y * width + x
        if visited[index] or not is_background(pixels[x, y]):
            continue
        visited[index] = 1
        pixels[x, y] = (pixels[x, y][0], pixels[x, y][1], pixels[x, y][2], 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                queue.append((nx, ny))

    image.save(destination_path, "PNG")


for filename in FILES:
    image_id = filename[:2]
    remove_background(SOURCE / filename, DEST / f"{image_id}.png")
