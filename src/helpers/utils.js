const findWorkers = (manager, query) => {
    return new Promise((resolve ) => {
        manager.insightsClient.instantQuery('tr-worker').then((q) => {
        
            q.on('searchResult', (items) => {
                resolve({ workerList: Object.keys(items).map(workerSid => items[workerSid]) });
            });
    
            q.search(query);
        });
    })
}

const findQueues = (manager, query) => {
    return new Promise((resolve ) => {
        manager.insightsClient.instantQuery('tr-queue').then((q) => {
        
            q.on('searchResult', (items) => {
                resolve({ queueList: Object.keys(items).map(queueSid => items[queueSid]) });
            });
    
            q.search(query);
        });
    })
}

const findQueueFromEnv = (name) => {
    const queues = process.env.REACT_APP_EXTERNAL_QUEUES.split(",");
    return queues.includes(name);
}

export {
    findWorkers,
    findQueues,
    findQueueFromEnv
}