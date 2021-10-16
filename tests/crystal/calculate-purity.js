function calculatePurity(shards) {
  var purity = 0;
  var uniqueSequences = [shards[0].sequence];

  while (shards.length > 0) {
    const shard = shards.shift();
    shards.forEach((comparisonShard) => {
      if (shard.creatorId === comparisonShard.creatorId) {
        purity += 10;
        if (shard.momentId === comparisonShard.momentId) {
          purity += 10;
          if (shard.clipId === comparisonShard.clipId) {
            purity += 10;
          } else {
            if (!uniqueSequences.includes(comparisonShard.sequence)) {
              purity += 20;
              uniqueSequences.push(comparisonShard.sequence);
            }
          }
        }
      }
    });
  }

  return purity;
}

export default calculatePurity;
