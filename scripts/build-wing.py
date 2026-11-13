from __future__ import annotations

import base64
import json
import lzma
import math
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / "aileron-f1" / "geometry.lzma.b64"
OUTPUT = ROOT / "aileron-f1" / "aileron-F1-2019.glb"
VERTICES = 1874
TRIANGLES = 3665
BOUNDS_MIN = [-0.519, -0.000241223679, -0.693147063]
BOUNDS_MAX = [0.519, 0.670000017, 0.109139733]


def pad(data: bytes, fill: bytes) -> bytes:
    return data + fill * ((-len(data)) % 4)


def build() -> None:
    raw = lzma.decompress(base64.b64decode(PAYLOAD.read_text(encoding="ascii").strip()))
    expected = (VERTICES * 3 + TRIANGLES * 3) * 2
    if len(raw) != expected:
        raise ValueError(f"Geometry length mismatch: {len(raw)} vs {expected}")

    coord_count = VERTICES * 3
    coordinates = struct.unpack_from(f"<{coord_count}H", raw, 0)
    indices = struct.unpack_from(f"<{TRIANGLES * 3}H", raw, coord_count * 2)

    vertices = [
        tuple(
            BOUNDS_MIN[j] + (BOUNDS_MAX[j] - BOUNDS_MIN[j]) * coordinates[3 * i + j] / 65535
            for j in range(3)
        )
        for i in range(VERTICES)
    ]

    normals = [[0.0, 0.0, 0.0] for _ in vertices]
    for a, b, c in zip(indices[::3], indices[1::3], indices[2::3]):
        ax, ay, az = vertices[a]
        bx, by, bz = vertices[b]
        cx, cy, cz = vertices[c]
        ab = bx - ax, by - ay, bz - az
        ac = cx - ax, cy - ay, cz - az
        cross = (
            ab[1] * ac[2] - ab[2] * ac[1],
            ab[2] * ac[0] - ab[0] * ac[2],
            ab[0] * ac[1] - ab[1] * ac[0],
        )
        for index in (a, b, c):
            for axis in range(3):
                normals[index][axis] += cross[axis]

    for normal in normals:
        length = math.sqrt(sum(value * value for value in normal)) or 1.0
        for axis in range(3):
            normal[axis] /= length

    positions = struct.pack(f"<{coord_count}f", *(v for point in vertices for v in point))
    vertex_normals = struct.pack(f"<{coord_count}f", *(v for point in normals for v in point))
    faces = raw[coord_count * 2:]
    binary = positions + vertex_normals + faces
    position_size, normal_size = len(positions), len(vertex_normals)

    gltf = {
        "asset": {"version": "2.0", "generator": "Raphaël Flipo"},
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": position_size, "target": 34962},
            {"buffer": 0, "byteOffset": position_size, "byteLength": normal_size, "target": 34962},
            {
                "buffer": 0,
                "byteOffset": position_size + normal_size,
                "byteLength": len(faces),
                "target": 34963,
            },
        ],
        "accessors": [
            {
                "bufferView": 0, "componentType": 5126, "count": VERTICES,
                "type": "VEC3",
                "min": [min(p[i] for p in vertices) for i in range(3)],
                "max": [max(p[i] for p in vertices) for i in range(3)],
            },
            {"bufferView": 1, "componentType": 5126, "count": VERTICES, "type": "VEC3"},
            {"bufferView": 2, "componentType": 5123, "count": len(indices), "type": "SCALAR"},
        ],
        "materials": [
            {
                "name": "Wing",
                "doubleSided": True,
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.21, 0.46, 0.31, 1.0],
                    "metallicFactor": 0.2,
                    "roughnessFactor": 0.5,
                },
            }
        ],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "material": 0}]}],
        "nodes": [{"mesh": 0}],
        "scenes": [{"nodes": [0]}],
        "scene": 0,
    }
    json_chunk = pad(json.dumps(gltf, separators=(",", ":")).encode("utf-8"), b" ")
    binary_chunk = pad(binary, b"\0")
    total = 12 + 8 + len(json_chunk) + 8 + len(binary_chunk)
    data = b"glTF" + struct.pack("<II", 2, total)
    data += struct.pack("<I4s", len(json_chunk), b"JSON") + json_chunk
    data += struct.pack("<I4s", len(binary_chunk), b"BIN\0") + binary_chunk
    OUTPUT.write_bytes(data)
    print(f"Created {OUTPUT.relative_to(ROOT)} ({len(data):,} bytes)")


if __name__ == "__main__":
    build()
