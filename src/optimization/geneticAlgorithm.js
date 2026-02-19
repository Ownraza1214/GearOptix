/**
 * GearOptix Genetic Algorithm Optimization
 * Per Section 9-9 iterative design procedure
 */

export class GeneticAlgorithm {
    constructor(options = {}) {
        this.populationSize = options.populationSize || 50;
        this.generations = options.generations || 100;
        this.mutationRate = options.mutationRate || 0.1;
        this.crossoverRate = options.crossoverRate || 0.8;
        this.eliteCount = options.eliteCount || 2;
        this.bounds = options.bounds || [];
        this.objectiveFn = options.objectiveFn || (() => 0);
        this.constraintFns = options.constraintFns || [];
        this.convergenceHistory = [];
    }

    initialize() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const individual = this.bounds.map(([min, max]) =>
                min + Math.random() * (max - min)
            );
            this.population.push(individual);
        }
    }

    evaluate(individual) {
        let fitness = this.objectiveFn(individual);

        // Penalty for constraint violations
        for (const constraint of this.constraintFns) {
            const violation = constraint(individual);
            if (violation > 0) fitness += violation * 1e6;
        }
        return fitness;
    }

    select(fitnesses) {
        // Tournament selection
        const tournamentSize = 3;
        let bestIdx = Math.floor(Math.random() * this.populationSize);
        for (let i = 1; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * this.populationSize);
            if (fitnesses[idx] < fitnesses[bestIdx]) bestIdx = idx;
        }
        return this.population[bestIdx].slice();
    }

    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) return [parent1.slice(), parent2.slice()];

        const child1 = [], child2 = [];
        const alpha = Math.random();
        for (let i = 0; i < parent1.length; i++) {
            child1.push(alpha * parent1[i] + (1 - alpha) * parent2[i]);
            child2.push((1 - alpha) * parent1[i] + alpha * parent2[i]);
        }
        return [child1, child2];
    }

    mutate(individual) {
        return individual.map((gene, i) => {
            if (Math.random() < this.mutationRate) {
                const [min, max] = this.bounds[i];
                const range = max - min;
                return Math.max(min, Math.min(max, gene + (Math.random() - 0.5) * range * 0.2));
            }
            return gene;
        });
    }

    run(onProgress) {
        this.initialize();
        this.convergenceHistory = [];
        let bestEver = null;
        let bestFitnessEver = Infinity;

        for (let gen = 0; gen < this.generations; gen++) {
            const fitnesses = this.population.map(ind => this.evaluate(ind));

            // Track best
            const bestIdx = fitnesses.indexOf(Math.min(...fitnesses));
            if (fitnesses[bestIdx] < bestFitnessEver) {
                bestFitnessEver = fitnesses[bestIdx];
                bestEver = this.population[bestIdx].slice();
            }

            const avgFitness = fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length;
            this.convergenceHistory.push({
                generation: gen,
                bestFitness: bestFitnessEver,
                avgFitness,
                best: bestEver.slice()
            });

            if (onProgress) onProgress(gen, this.generations, bestFitnessEver, bestEver);

            // Next generation
            const sorted = fitnesses.map((f, i) => ({ fitness: f, individual: this.population[i] }))
                .sort((a, b) => a.fitness - b.fitness);

            const newPop = [];
            // Elitism
            for (let i = 0; i < this.eliteCount; i++) {
                newPop.push(sorted[i].individual.slice());
            }

            // Breeding
            while (newPop.length < this.populationSize) {
                const p1 = this.select(fitnesses);
                const p2 = this.select(fitnesses);
                const [c1, c2] = this.crossover(p1, p2);
                newPop.push(this.mutate(c1));
                if (newPop.length < this.populationSize) newPop.push(this.mutate(c2));
            }

            this.population = newPop;
        }

        return {
            bestSolution: bestEver,
            bestFitness: bestFitnessEver,
            convergenceHistory: this.convergenceHistory
        };
    }
}

/**
 * Run gear optimization using GA
 */
export function optimizeGear(params) {
    const {
        objective = 'weight', // 'weight', 'volume', 'cost'
        gearType = 'spur',
        power, speed, ratio,
        materialDensity = 7850, // kg/m³
        minTeeth = 17,
        maxTeeth = 60,
        moduleRange = [1, 10], // mm
        faceWidthRange = [10, 100], // mm
        safetyFactorMin = 1.5,
        generations = 80,
        populationSize = 40
    } = params;

    const bounds = [
        [minTeeth, maxTeeth],       // N_p
        moduleRange,                // module (mm)
        faceWidthRange              // face width (mm)
    ];

    const objectiveFn = ([N_p, mod, F]) => {
        const N_p_r = Math.round(N_p);
        const d_p = N_p_r * mod;
        const d_g = N_p_r * ratio * mod;

        if (objective === 'weight') {
            // Approximate weight: ρ × π/4 × (d²_p + d²_g) × F
            const vol = (Math.PI / 4) * (d_p * d_p + d_g * d_g) * F; // mm³
            return materialDensity * vol * 1e-9; // kg
        } else if (objective === 'volume') {
            return (Math.PI / 4) * (d_p * d_p + d_g * d_g) * F;
        } else { // cost
            return materialDensity * (Math.PI / 4) * (d_p * d_p + d_g * d_g) * F * 1e-9 * 5; // $/kg
        }
    };

    const constraintFns = [
        // Min teeth
        ([N_p]) => Math.max(0, minTeeth - Math.round(N_p)),
        // Face width / module ratio (should be 8-16)
        ([N_p, mod, F]) => Math.max(0, 8 * mod - F) + Math.max(0, F - 16 * mod),
        // Integer gear teeth
        ([N_p]) => {
            const N_g = Math.round(N_p) * ratio;
            return Math.abs(N_g - Math.round(N_g)) > 0.1 ? 10 : 0;
        }
    ];

    const ga = new GeneticAlgorithm({
        populationSize, generations, bounds,
        objectiveFn, constraintFns,
        mutationRate: 0.15, crossoverRate: 0.85
    });

    return ga.run();
}

export default { GeneticAlgorithm, optimizeGear };
