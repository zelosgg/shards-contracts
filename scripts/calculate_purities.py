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
    # matched_creators = None
    # matched_moments = None
    # matched_clips = None
    # matched_sequences = None
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

    # if shards[0].clip.moment.creator.id == shards[1].clip.moment.creator.id:
    #     purity += 10
    #     matched_creators = (matched_creators or 1) + 1
    #     if shards[0].clip.moment.id == shards[1].clip.moment.id:
    #         purity += 10
    #         matched_moments = (matched_moments or 1) + 1
    #         if shards[0].clip.id == shards[1].clip.id:
    #             purity += 10
    #             matched_clips = (matched_clips or 1) + 1
    #         else:
    #             purity += 20
    #             matched_sequences = (matched_sequences or 1) + 1

    # if shards[0].clip.moment.creator.id == shards[2].clip.moment.creator.id:
    #     purity += 10
    #     matched_creators = (matched_creators or 1) + 1
    #     if shards[0].clip.moment.id == shards[2].clip.moment.id:
    #         purity += 10
    #         matched_moments = (matched_moments or 1) + 1
    #         if shards[0].clip.id == shards[2].clip.id:
    #             purity += 10
    #             matched_clips = (matched_clips or 1) + 1
    #         else:
    #             purity += 20
    #             matched_sequences = (matched_sequences or 1) + 1

    # if (matched_sequences or 0) >= 2:
    #     purity += 10

    # if (matched_clips or 0) >= 3:
    #     purity += 10

    # while len(shards) > 0:
    #     shard = shards.pop(0)
    #     for comparison_shard in shards:
    #         # Add purity for same creator
    #         if shard.clip.moment.creator.id == comparison_shard.clip.moment.creator.id:
    #             purity += 5
    #             matched_creators = (matched_creators or 1) + 1
    #             # Add purity for same moment
    #             if shard.clip.moment.id == comparison_shard.clip.moment.id:
    #                 purity += 5
    #                 matched_moments = (matched_moments or 1) + 1
    #                 # Add purity for same clip ID
    #                 if shard.clip.id == comparison_shard.clip.id:
    #                     purity += 5
    #                     matched_clips = (matched_clips or 1) + 1
    #                 if comparison_shard.clip.sequence not in unique_sequences:
    #                     purity += 10
    #                     unique_sequences.append(comparison_shard.clip.sequence)

    return (
        purity,
        (len(shards) - len(unique_creators) or None),
        (len(shards) - len(unique_moments) or None),
        (len(shards) - len(unique_clips) or None),
        (len(unique_sequences) or None),
    )
    # return (
    #     purity,
    #     matched_creators,
    #     matched_moments,
    #     matched_clips,
    #     matched_sequences,
    # )


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
    print("Matched Creators:", combination["matched_creators"])
    print("Matched Moments:", combination["matched_moments"])
    print("Matched Clips:", combination["matched_clips"])
    print("Unique Sequences:", combination["different_sequences"])
    print()

print("All possible purities", sorted(all_purities))

# for shard in shards:
#     print(
#         "shard id:",
#         shard.id,
#         "clip id:",
#         shard.clip.id,
#         shard.clip.sequence,
#         "moment id:",
#         shard.clip.moment.id,
#         "creator id:",
#         shard.clip.moment.creator.id,
#     )
