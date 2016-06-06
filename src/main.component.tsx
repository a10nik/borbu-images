import * as React from 'react';
import { Link } from 'react-router';
import { Paper } from 'material-ui';

import AuthComponent from './auth/ui/auth.component.tsx';
import LoadingComponent from './common/loading/loading.component.tsx';
import {Toggle} from "material-ui";
import {Toolbar} from "material-ui";
import {ToolbarGroup, DropDownMenu, MenuItem, ToolbarTitle, FlatButton, TextField} from "material-ui";
import ImageTabs from "./image-tabs/image-tabs.component";

export default class MainComponent extends React.Component<{ children: any }, { splitVertically: boolean }> {

    render() {
        return(
            <div>
                <nav className="navbar navbar-inverse navbar-fixed-top">
                    <div className="container">
                        <div className="navbar-header">
                            <Link  className="navbar-brand" to="/">Image Tools</Link>
                        </div>

                    </div>
                </nav>
                <div className="container">
                    <LoadingComponent />
                    <ImageTabs/>
                </div>
                <footer className="footer">
                    <Paper zDepth={2}>
                        <div className="container">
                            <div className="row">
                                <div className="col-md-3 col-sm-6">
                                    <i className="fa fa-github fa-lg"></i>
                                    <a href="https://github.com/a10nik/borbu-images">Github</a>
                                </div>
                            </div>
                            <hr />
                            <div className="row">
                                <div className="col-md-12">
                                    <p className="text-muted text-center">Artyom Desyatnikov 2016</p>
                                </div>
                            </div>
                        </div>
                    </Paper>
                </footer>
            </div>
        );
    }

}