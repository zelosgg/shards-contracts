import csv

with open('moments.csv') as moments:
    json = csv.DictReader(moments)
    print([row for row in json])

with open('clips.csv') as clips:
    json = csv.DictReader(clips)
    print([row for row in json])
