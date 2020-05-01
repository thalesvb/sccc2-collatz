/**
 * A (simple) monitor to check random facts.
 */
export class Monitor {
    /**
     * Logs metrics as a starting value for a delta.
     */
    start() {
        this.startTime = process.hrtime.bigint();
        this.startMemoryUsage = process.memoryUsage();
        return this;
    }
    /**
     * Logs metrics as a final value for a delta.
     */
    end() {
        this.endTime = process.hrtime.bigint();
        this.endMemoryUsage = process.memoryUsage();
        return this;
    }
    /** Calculates the delta between {@link Monitor#end end} and {@link Monitor#start start}, and displays them.*/
    display() {
        const runtimeMs = Math.floor(Number(this.endTime - this.startTime) / 1000000);
        const memoryMB = (this.endMemoryUsage.rss - this.startMemoryUsage.rss) / 1024 / 1024;
        console.log("Runtime: " + runtimeMs + " ms");
        console.log("Memory usage: " + memoryMB + " MB");
    }
}