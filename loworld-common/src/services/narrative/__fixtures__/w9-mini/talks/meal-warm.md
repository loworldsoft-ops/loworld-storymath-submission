---
situation: share-meal
with: [friend]
when: stance(friend, warm, trusting)
effects: { bond: { friend: 10 }, grant: [bead.ga] }
---
따뜻한 밥이 있었다.

@friend[tease]: 또 늦었네.
@friend: 늦었네.

@protagonist[mock]: 늦은 게 대수냐.
@protagonist: 미안.

[[웃음]]

:::slot 웃음
- resonance(friend, resonant) → 벗이 웃었다.
- else → 벗은 말없이 밥을 내밀었다.
:::
