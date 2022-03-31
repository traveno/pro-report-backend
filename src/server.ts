import express, { response } from 'express';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { PS_RoutingRow, PS_TrackingRow, PS_WorkOrder, sequelize, UpdateInfo } from './db';
import path from 'path';
import NodeCache from 'node-cache';

const cache = new NodeCache();

const app = express();

const port = 3000;

app.use(express.static(__dirname + '/shop-meister'));

app.get('/api', (request: Request, response: Response) => {
    response.json({ info: 'Hello API' });
});

app.get('/api/workorders', getWorkOrders);
app.get('/api/workordersdetailed', getWorkOrdersDetailed)

app.get('/api/workorders/:index', getWorkOrderByIndex);
app.get('/api/workorders/by_resource/:resource', getWorkOrdersByResource);
app.get('/api/workorders/by_routing_activity/:fromDate/:toDate', getWorkOrdersByRoutingActivity)

app.get('/api/resource_activity', getResourceActivity);

app.get('/api/routingrows', getAllRoutingRows);
app.get('/api/routingrows/:workOrderId', getRoutingRowsByWorkOrderId);
app.get('/api/routingrows/by_date/:fromDate/:toDate', getRoutingRowsByDate)

app.get('/api/trackingrows', getAllTrackingRows);
app.get('/api/trackingrows/:workOrderId', getTrackingRowsByWorkOrderId);

app.get('/api/updateinfos', getAllUpdateInfos);

app.get('/*', (request, response, next) => {
    response.sendFile(path.join(__dirname + '/shop-meister/index.html'));
});


app.listen(port, () => {
    sequelize.sync();
    console.log(`Server listening on port ${port}`);
});

function getWorkOrders(request: Request, response: Response) {
    PS_WorkOrder.findAll().then(results => {
        response.status(200).json(results);
    });
}

function getWorkOrdersDetailed(request: Request, response: Response) {
    let bigData = cache.get<PS_WorkOrder[]>('BIGDATA');

    if (bigData === undefined) {
        PS_WorkOrder.findAll({
            include: [PS_RoutingRow, PS_TrackingRow]
        }).then(results => {
            cache.set('BIGDATA', results, 300);
            response.status(200).json(results);
        });
    } else {
        response.status(200).json(bigData);
    }
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

function getWorkOrdersByRoutingActivity(request: Request, response: Response) {
    try {
        var fromDate = new Date(request.params.fromDate);
        var toDate = new Date(request.params.toDate);
    } catch (error) {
        throw error;
    }

    let temp: PS_WorkOrder[] = [];

    PS_WorkOrder.findAll({
        order: [['index', 'DESC']],
        include: [PS_RoutingRow]
    }).then(results => {
        for (let wo of results) {
            for (let row of wo.routingRows) {
                if (!row.completeDate) continue;
                if (row.completeDate > fromDate && row.completeDate < toDate)
                    if (!temp.map(e => e.id).includes(wo.id))
                         temp.push(wo);
            }
        }

        response.status(200).json(temp);
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

function getRoutingRowsByDate(request: Request, response: Response) {
    try {
        var fromDate = new Date(request.params.fromDate);
        var toDate = new Date(request.params.toDate);
    } catch (error) {
        throw error;
    }

    PS_RoutingRow.findAll({
        where: {
            completeDate: {
                [Op.and]: [
                    { [Op.gt]: fromDate },
                    { [Op.lt]: toDate }
                ]
            }
        }
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

function getAllUpdateInfos(request: Request, response: Response) {
    UpdateInfo.findAll().then(results => {
        response.status(200).json(results);
    });
}