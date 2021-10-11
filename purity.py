from itertools import product

class Shard:
    def __init__(self, *params):
        self.moment_id = params[0][0]
        self.clip_id = params[0][1]
        self.sequence = params[0][2]
        self.creator_id = params[0][3]

purities = []

def get_purity(shards):
    purity = 0
    unique_sequences = [shards[0].sequence]

    for shard in shards:
        shards.remove(shard)
        for comparison_shard in shards:
            if shard.creator_id == comparison_shard.creator_id:
                purity += 10
                if shard.moment_id == comparison_shard.moment_id:
                    purity += 10
                    if shard.clip_id == comparison_shard.clip_id:
                        purity += 10
                        if shard.sequence not in unique_sequences:
                            purity += 10
                            unique_sequences.append(shard.sequence)

    purities.append(purity)


for one in product(range(3), range(3), range(3), range(3)):
    for two in product(range(3), range(3), range(3), range(3)):
        for three in product(range(3), range(3), range(3), range(3)):
            shard1 = Shard(one)
            shard2 = Shard(two)
            shard3 = Shard(three)
            get_purity([shard1, shard2, shard3])


print(sorted(set(purities)))

