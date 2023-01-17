# Ecosystem Evolution Simulator

(inspired by [Primer's Youtube channel](https://www.youtube.com/@PrimerBlobs))

## About the Project

The simulator is a tool to implement a stripped-down basic demonstration of populations with different traits and genes. It allows the user to set up
a world with a population of their choice, and simulate this world for 100s of days. The current project version allows one to view the trends and history
of the various genes and traits present in the population.

image

### World Mechanism

Each day, there are a number of food items placed randomly in the world, and each blob currently alive spawns at their home (on the circumference).
When the simulation of the day begins, the blobs move around in search of food. The different trait values for each blob's gene influences the movement
and strategies of the blob.

gif

If a blob makes it back to their home with at least one food item, they will survive until the next day. Further, if the blob collects 2 food items, they
will produce an offspring with the same gene make-up.

### Traits / Attributes

Currently, there are 5 traits that are associated with a certain group:

1. Locomotion
  - Speed: distance travelled by the blob per time-step
  - Stamina: total time that the blob can survive per day
2. Brain Power
  - Vision: distance that the blob can scout for food/predators
  - GPS: ease at which the blob can find its way home
3. Social Skills
  - Greed: probability of looking for a 2nd food item instead of going home
  
**Mutation**: If a gene's trait is mutatable, then when a blob of that gene produces an offspring, there is a chance for the value of the said trait changes (while remaining within the token limit).

### Designing a Gene

When designing a gene, it is provided with a number of tokens for the various traits. The number of tokens distributed to a trait determines the normalized value of that trait for the gene.

image

## Usage

1. Clone the repository.
2. Run a local server in the main directory using `python`, `liveserver`, etc. ```python3 -m http.server [PORT]```
3. Open `localhost:[PORT]` in your browser.

Enjoy!
