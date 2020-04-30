export class Monitor {
    start() {
        this.startTime = process.hrtime.bigint();
        this.startMemoryUsage = process.memoryUsage();
        return this;
    }
    end() {
        this.endTime = process.hrtime.bigint();
        this.endMemoryUsage = process.memoryUsage();
        return this;
    }
    display() {
        const iRuntimeMs = Math.floor(Number(this.endTime - this.startTime) / 1000000);
        const iMemoryMB = (this.endMemoryUsage.rss - this.startMemoryUsage.rss) / 1024 / 1024;
        console.log("Runtime: " + iRuntimeMs + " ms");
        console.log("Memory usage: " + iMemoryMB + " MB");
    }
}