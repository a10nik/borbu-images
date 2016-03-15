import 'bootswatch/paper/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import './main.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router, Route, Redirect, IndexRoute } from 'react-router';
require("react-tap-event-plugin")();

import * as InitAppService from './main.app.service';

import MainComponent from './main.component';

InitAppService.init().then(renderRouter);

function renderRouter() {
    ReactDOM.render((
        <Router>
            <Route path="/" component={MainComponent}/>
        </Router>
    ), document.getElementById('content'));
}
