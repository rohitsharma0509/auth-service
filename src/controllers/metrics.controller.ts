import * as express from 'express'
import { Request, Response } from 'express'
import * as client from 'prom-client'
import { register } from 'prom-client'


class MetricsController {
    public path = '/actuator/prometheus'
    public router = express.Router()


    constructor() {
        this.initRoutes()
        this.initMetrics()
    }

    public initRoutes() {
        this.router.get('/', this.metrics)
    }

    public initMetrics() {
        register.setDefaultLabels({ app: 'auth-service' })
        client.collectDefaultMetrics({ register })
    }

    metrics = (req: Request, res: Response) => {
        res.setHeader('Content-Type', register.contentType)
        register.metrics().then((metrics) => {
            console.log('resolved', metrics)
            res.send(metrics)
        }).catch((error) => {
            console.log('rejected', error)
            res.send(error)
        }).finally(() => {
            console.log('completed')
        })
    }
}

export default MetricsController