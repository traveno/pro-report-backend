import express, { response } from 'express';
import { Request, Response } from 'express';
import { PS_RoutingRow, PS_TrackingRow, PS_WorkOrder, sequelize } from './db';

const app = express();

const port = 3000;



app.get('/', (request: Request, response: Response) => {
    response.json({ info: 'Node.js server functioning normally' });
});

app.get('/workorders', getAllWorkOrders);
app.get('/workorders/:index', getWorkOrderByIndex);

app.get('/routingrows', getAllRoutingRows);
app.get('/routingrows/:workOrderId', getRoutingRowsByWorkOrderId);

app.get('/trackingrows', getAllTrackingRows);
app.get('/trackingrows/:workOrderId', getTrackingRowsByWorkOrderId);


app.listen(port, () => {
    sequelize.sync();
    console.log(`Server listening on port ${port}`);
});

function getAllWorkOrders(request: Request, response: Response) {
    PS_WorkOrder.findAll().then(results => {
        response.status(200).json(results);
        console.log(...results.map(e => e.id));
    });
}

function getWorkOrderByIndex(request: Request, response: Response) {
    PS_WorkOrder.findAll({ where: { index: request.params.index } }).then(results => {
        response.status(200).json(results);
    })

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