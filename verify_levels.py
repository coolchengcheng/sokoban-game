#!/usr/bin/env python3
import re
import ast
import pathlib
import collections

DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


def load_levels(path: pathlib.Path):
    text = path.read_text()
    m = re.search(r'const LEVELS=\[(.*?)\];\nconst W=', text, re.S)
    arr = '[' + m.group(1) + ']'
    arr = re.sub(r'(\{|,)\s*n\s*:', r"\1'n':", arr)
    arr = re.sub(r'(\{|,)\s*m\s*:', r"\1'm':", arr)
    return ast.literal_eval(arr)


def solve(rows):
    width = max(len(r) for r in rows)
    rows = [r.ljust(width) for r in rows]
    height = len(rows)

    walls, targets, boxes, floors = set(), set(), set(), set()
    player = None

    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in '@+':
                player = (x, y)
            if ch == '#':
                walls.add((x, y))

    q = collections.deque([player])
    connected = {player}
    while q:
        x, y = q.popleft()
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in connected and rows[ny][nx] != '#':
                connected.add((nx, ny))
                q.append((nx, ny))

    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '#':
                continue
            if ch != ' ' or (x, y) in connected:
                floors.add((x, y))
            if ch in '.+*':
                targets.add((x, y))
            if ch in '$*':
                boxes.add((x, y))

    start = (tuple(sorted(boxes)), player)
    q = collections.deque([(start, '')])
    seen = {start}

    while q:
        (box_state, player_pos), path = q.popleft()
        boxes_set = frozenset(box_state)
        if all(box in targets for box in boxes_set):
            return path

        rq = collections.deque([player_pos])
        reachable = {player_pos}
        blocked = walls | set(boxes_set)
        while rq:
            x, y = rq.popleft()
            for dx, dy in DIRS:
                nxt = (x + dx, y + dy)
                if nxt in reachable or nxt in blocked or nxt not in floors:
                    continue
                reachable.add(nxt)
                rq.append(nxt)

        for bx, by in box_state:
            for dx, dy, mark in [(1, 0, 'R'), (-1, 0, 'L'), (0, 1, 'D'), (0, -1, 'U')]:
                push_from = (bx - dx, by - dy)
                dest = (bx + dx, by + dy)
                if push_from not in reachable or dest in walls or dest in boxes_set or dest not in floors:
                    continue
                new_boxes = tuple(sorted(dest if (x, y) == (bx, by) else (x, y) for x, y in box_state))
                state = (new_boxes, (bx, by))
                if state in seen:
                    continue
                seen.add(state)
                q.append((state, path + mark))

    return None


def main():
    levels = load_levels(pathlib.Path(__file__).with_name('index.html'))
    all_ok = True
    for i, level in enumerate(levels, 1):
        solution = solve(level['m'])
        print(f"{i}. {level['n']}: {'OK' if solution else 'FAIL'} {solution or ''}".rstrip())
        all_ok &= solution is not None
    raise SystemExit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
