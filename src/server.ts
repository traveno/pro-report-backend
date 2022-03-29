import express, { response } from 'express';
import { Request, Response } from 'express';
import { PS_RoutingRow, PS_TrackingRow, PS_WorkOrder, sequelize } from './db';

const app = express();

const port = 3000;



app.get('/api', (request: Request, response: Response) => {
    response.json({ info: 'Hello API' });
});

app.get('/api/workorders', getAllWorkOrders);

app.get('/api/workorders/:index', getWorkOrderByIndex);
app.get('/api/workorders/by_resource/:resource', getWorkOrdersByResource);

app.get('/api/resource_activity', getResourceActivity);

app.get('/api/routingrows', getAllRoutingRows);
app.get('/api/routingrows/:workOrderId', getRoutingRowsByWorkOrderId);

app.get('/api/trackingrows', getAllTrackingRows);
app.get('/api/trackingrows/:workOrderId', getTrackingRowsByWorkOrderId);


app.listen(port, () => {
    sequelize.sync();
    console.log(`Server listening on port ${port}`);
});

function getAllWorkOrders(request: Request, response: Response) {
    PS_WorkOrder.findAll().then(results => {
        response.status(200).json(results);
    });
}

function getWorkOrderByIndex(request: Request, response: Response) {
    PS_WorkOrder.findAll({
        where: { index: request.params.index },
        include: [PS_RoutingRow, PS_TrackingRow]
    }).then(results => {
        response.status(200).json(results);
    });
}

function getWorkOrdersByResource(request: Request, response: Response) {
    PS_WorkOrder.findAll({
        include: [PS_RoutingRow]
    }).then(results => {
        let filteredResults: PS_WorkOrder[] = [];

        for (let wo of results)
            for(let row of wo.routingRows)
                if (row.resource.toLowerCase().trim() === request.params.resource.toLowerCase().trim())
                    filteredResults.push(wo);

        response.status(200).json(filteredResults);
    });
}

function getResourceActivity(request: Request, response: Response) {
    let resources = ['DMU1', 'DMU2', 'DMU3', 'DMU4', 
                     'HAAS1', 'HAAS2', 'HAAS3', 'HAAS4', 'HAAS5', 'HAAS6', 'HAAS7', 'HAAS8',
                     'MAM1', 'MAM2', 'MAM3',
                     'MAK1', 'MAK2', 'MAK3', 'MAK4', 'MAK5', 'MAK6', 'MAK7',
                     'NL2500', 'NLX2500', 'NT1000', 'NTX2000', 'L2-20'];

    let temp = new Map<string, ResourceActivity>();

    PS_WorkOrder.findAll({
        include: [PS_RoutingRow]
    }).then(results => {
        results.forEach(workorder => {
            for (let routingRow of workorder.routingRows) {
                if (resources.includes(routingRow.resource)) {
                    let activity = temp.get(routingRow.resource);

                    if (activity === undefined)
                        activity = {} as ResourceActivity;
                    
                    if (workorder.status === 0)
                        activity.active++;
                    else if (workorder.status === 4)
                        activity.mfgcomplete++;
                    else if (workorder.status === 6)
                        activity.shipped++;
                    else if (workorder.status === 3)
                        activity.invoiced++;

                    temp.set(routingRow.resource, activity);
                }
            }
        });
        response.status(200).json(temp);
    });
}

interface ResourceActivity {
    active: number,
    mfgcomplete: number,
    shipped: number,
    invoiced: number
}

function getAllRoutingRows(request: Request, response: Response) {
    PS_RoutingRow.findAll().then(results => {
        response.status(200).json(results);
    });
}

function getRoutingRowsByWorkOrderId(request: Request, response: Response) {
    PS_RoutingRow.findAll({
        where: { 
            workOrderId: request.params.workOrderId 
        },
        attributes: ['op', 'opDesc', 'resource', 'completeTotal', 'completeDate'],
        order: [['id', 'ASC']]
    }).then(results => {
        response.status(200).json(results);
    });
}

function getAllTrackingRows(request: Request, response: Response) {
    PS_TrackingRow.findAll().then(results => {
        response.status(200).json(results);
    });
}

function getTrackingRowsByWorkOrderId(request: Request, response: Response) {
    PS_TrackingRow.findAll({ where: { workOrderId: request.params.workOrderId } }).then(results => {
        response.status(200).json(results);
    });
}