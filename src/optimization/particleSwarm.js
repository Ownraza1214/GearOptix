/**
 * GearOptix Particle Swarm Optimization
 * Multi-objective gear optimization
 */

export class ParticleSwarm {
    constructor(options = {}) {
        this.swarmSize = options.swarmSize || 30;
        this.iterations = options.iterations || 100;
        this.w = options.inertia || 0.7;        // inertia weight
        this.c1 = options.cognitive || 1.5;     // cognitive coefficient
        this.c2 = options.social || 1.5;        // social coefficient
        this.bounds = options.bounds || [];
        this.objectiveFn = options.objectiveFn || (() => 0);
        this.convergenceHistory = [];
    }

    run(onProgress) {
        const dim = this.bounds.length;
        this.convergenceHistory = [];

        // Initialize particles
        const particles = [];
        let globalBest = null;
        let globalBestFitness = Infinity;

        for (let i = 0; i < this.swarmSize; i++) {
            const position = this.bounds.map(([min, max]) => min + Math.random() * (max - min));
            const velocity = this.bounds.map(([min, max]) => (Math.random() - 0.5) * (max - min) * 0.1);
            const fitness = this.objectiveFn(position);

            particles.push({
                position, velocity, fitness,
                bestPosition: position.slice(),
                bestFitness: fitness
            });

            if (fitness < globalBestFitness) {
                globalBestFitness = fitness;
                globalBest = position.slice();
            }
        }

        // Iterate
        for (let iter = 0; iter < this.iterations; iter++) {
            // Adaptive inertia weight (decreasing)
            const w = this.w * (1 - iter / this.iterations * 0.5);

            for (const p of particles) {
                // Update velocity
                for (let d = 0; d < dim; d++) {
                    const r1 = Math.random(), r2 = Math.random();
                    p.velocity[d] = w * p.velocity[d]
                        + this.c1 * r1 * (p.bestPosition[d] - p.position[d])
                        + this.c2 * r2 * (globalBest[d] - p.position[d]);

                    // Velocity clamping
                    const range = this.bounds[d][1] - this.bounds[d][0];
                    p.velocity[d] = Math.max(-range * 0.2, Math.min(range * 0.2, p.velocity[d]));
                }

                // Update position
                for (let d = 0; d < dim; d++) {
                    p.position[d] += p.velocity[d];
                    p.position[d] = Math.max(this.bounds[d][0], Math.min(this.bounds[d][1], p.position[d]));
                }

                // Evaluate
                p.fitness = this.objectiveFn(p.position);

                // Update personal best
                if (p.fitness < p.bestFitness) {
                    p.bestFitness = p.fitness;
                    p.bestPosition = p.position.slice();
                }

                // Update global best
                if (p.fitness < globalBestFitness) {
                    globalBestFitness = p.fitness;
                    globalBest = p.position.slice();
                }
            }

            const avgFitness = particles.reduce((s, p) => s + p.fitness, 0) / particles.length;
            this.convergenceHistory.push({
                iteration: iter,
                bestFitness: globalBestFitness,
                avgFitness,
                best: globalBest.slice()
            });

            if (onProgress) onProgress(iter, this.iterations, globalBestFitness, globalBest);
        }

        return {
            bestSolution: globalBest,
            bestFitness: globalBestFitness,
            convergenceHistory: this.convergenceHistory
        };
    }
}

export default { ParticleSwarm };
