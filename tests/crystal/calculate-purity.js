function calculatePurity(shards) {
  var purity = 10 * shards.length * shards.length + 10;
  var uniqueInfluencers = []
  var uniqueMoments = []
  var uniqueClips = []
  var uniqueSequences = []

  for (const shard of shards) {
    if (!uniqueInfluencers.includes(shard.creatorId)) {
      uniqueInfluencers.push(shard.creatorId)
      uniqueMoments.push(shard.momentId)
      uniqueClips.push(shard.clipId)
    } else if (!uniqueMoments.includes(shard.momentId)) {
      uniqueMoments.push(shard.momentId)
      uniqueClips.push(shard.clipId)
    } else if (!uniqueClips.includes(shard.clipId)) {
      uniqueClips.push(shard.clipId)
      uniqueSequences.push(shard.sequence)
    }
  }

  purity -= uniqueInfluencers.length * 10
  purity -= uniqueMoments.length * 10
  purity -= uniqueClips.length * 10
  purity += uniqueSequences.length * 20

  if (uniqueSequences.length >= 1) {
    purity += 10
  }

  if (shards.length - uniqueClips.length >= shards.length - 1) {
    purity += 10
  }

  return purity;
}

export default calculatePurity;
