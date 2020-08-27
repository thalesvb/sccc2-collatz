/**
 * A (simple) monitor to check some runtime metrics.
 * 
 * Not rocket science, but good enough for a joyride.
 */
export class Monitor {
    /**
     * Record data as a starting value for a delta.
     */
    start() {
        this.startTime = process.hrtime.bigint();
        this.startMemoryUsage = process.memoryUsage();
        return this;
    }
    /**
     * Record data as a final value for a delta.
     */
    end() {
        this.endTime = process.hrtime.bigint();
        this.endMemoryUsage = process.memoryUsage();
        return this;
    }
    /**
     * Calculates delta between {@link Monitor#end end} and {@link Monitor#start start} calls,
     * and displays them on console.
     */
    display() {
        const runtimeMs = Math.floor(Number(this.endTime - this.startTime) / 1000000);
        const memoryMB = (this.endMemoryUsage.rss - this.startMemoryUsage.rss) / 1024 / 1024;
        console.log(`Runtime: ${runtimeMs} ms`);
        console.log(`Memory usage: ${memoryMB.toFixed(2)} MB`);
    }
}