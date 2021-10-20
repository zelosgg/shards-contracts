from itertools import combinations

from rich import print

creator_ids = 0
moment_ids = 0
clip_ids = 0
shard_ids = 0


class Creator:
    def __init__(self):
        global creator_ids
        self.id = creator_ids
        creator_ids += 1


class Moment:
    def __init__(self, creator: Creator):
        global moment_ids
        self.id = moment_ids
        moment_ids += 1
        self.creator = creator


class Clip:
    def __init__(self, moment: Moment):
        global clip_ids
        self.id = clip_ids
        self.sequence = self.id % 3
        clip_ids += 1
        self.moment: Moment = moment


class Shard:
    def __init__(self, clip: Clip):
        global shard_ids
        self.id = shard_ids
        shard_ids += 1
        self.clip: Clip = clip


def generate_shards() -> list[Shard]:
    shards: list[Shard] = []
    for _ in range(3):
        creator = Creator()
        for _ in range(3):
            moment = Moment(creator)
            for _ in range(3):
                clip = Clip(moment)
                for _ in range(3):
                    shard = Shard(clip)
                    shards.append(shard)

    return shards


def calculate_purity(shards: list[Shard]):
    purity = 10 * len(shards) * len(shards) + 10
    unique_creators = []
    unique_moments = []
    unique_clips = []
    unique_sequences = []

    for shard in shards:
        if shard.clip.moment.creator.id not in unique_creators:
            unique_creators.append(shard.clip.moment.creator.id)
            unique_moments.append(shard.clip.moment.id)
            unique_clips.append(shard.clip.id)
        elif shard.clip.moment.id not in unique_moments:
            unique_moments.append(shard.clip.moment.id)
            unique_clips.append(shard.clip.id)
        elif shard.clip.id not in unique_clips:
            unique_clips.append(shard.clip.id)
            unique_sequences.append(shard.clip.sequence)

    purity -= len(unique_creators) * 10
    purity -= len(unique_moments) * 10
    purity -= len(unique_clips) * 10
    purity += len(unique_sequences) * 20

    if len(unique_sequences) >= 1:
        purity += 10

    if len(shards) - len(unique_clips) >= len(shards) - 1:
        purity += 10

    return (
        purity,
        (len(shards) - len(unique_creators) or None),
        (len(shards) - len(unique_moments) or None),
        (len(shards) - len(unique_clips) or None),
        (len(unique_sequences) or None),
    )


shards = generate_shards()
all_combinations = []
all_purities = []

for combination in combinations(shards, 3):
    (
        purity,
        matched_creators,
        matched_moments,
        matched_clips,
        different_sequences,
    ) = calculate_purity(list(combination))

    if purity not in all_purities:
        all_purities.append(purity)

    combination = {
        "purity": purity,
        "matched_creators": matched_creators,
        "matched_moments": matched_moments,
        "matched_clips": matched_clips,
        "different_sequences": different_sequences,
    }

    if combination not in all_combinations:
        all_combinations.append(combination)

for combination in sorted(all_combinations, key=lambda d: d["purity"]):
    print("Purity:", combination["purity"])
    print(
        "Matched Creators:",
        combination["matched_creators"] + 1
        if combination["matched_creators"]
        else None,
    )
    print(
        "Matched Moments:",
        combination["matched_moments"] + 1 if combination["matched_moments"] else None,
    )
    print(
        "Matched Clips:",
        combination["matched_clips"] + 1 if combination["matched_clips"] else None,
    )
    print(
        "Unique Sequences:",
        combination["different_sequences"] + 1
        if combination["different_sequences"]
        else None,
    )
    print()

print("All possible purities", sorted(all_purities))
