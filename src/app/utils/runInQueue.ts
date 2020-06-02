/**
 *  Executes functions sequentially, at most `maxProcessing` functions at once.
 * @param queue functions to execute
 * @param maxProcessing number of "threads"
 */
async function runInQueue<T>(functions: (() => Promise<T>)[], maxProcessing = 1): Promise<T[]> {
    const results: T[] = [];
    let resultIndex = 0;

    const runNext = (): Promise<any> => {
        const index = resultIndex;
        const executor = functions[index];
        resultIndex += 1;

        if (executor) {
            return executor().then((result) => {
                results[index] = result;
                return runNext();
            });
        }
        return Promise.resolve();
    };

    const promises: Promise<any>[] = [];
    for (let i = 0; i < maxProcessing; i++) {
        promises.push(runNext());
    }
    await Promise.all(promises);
    return results;
}

export default runInQueue;
