import * as React from 'react';
import { Link } from 'react-router';
import { Paper } from 'material-ui';

import AuthComponent from './auth/ui/auth.component.tsx';
import LoadingComponent from './common/loading/loading.component.tsx';
import ImageWindowComponent from './image-window/image-window.component';
import {Toggle} from "material-ui";
import {Toolbar} from "material-ui";
import {ToolbarGroup, DropDownMenu, MenuItem, ToolbarTitle, FlatButton} from "material-ui";

export default class MainComponent extends React.Component<{ children: any }, { splitVertically: boolean }> {

    constructor(props) {
        super(props);

        this.state = {
            splitVertically: true
        };
    }

    private getPanelStyle(i: number) {
        return {
            display: "inline-block",
            marginTop: 20,
            width: this.state.splitVertically ? "48%" : "100%",
            marginRight: this.state.splitVertically && i === 0 ? "4%" : 0,
            verticalAlign: "top"
        };
    }

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
                    <Toolbar>
                        <ToolbarGroup firstChild={true} float="left">
                            <DropDownMenu value={this.state.splitVertically} onChange={(e, i, val) => this.setState({ splitVertically: val })}>
                                <MenuItem value={true} primaryText="Split vertically" />
                                <MenuItem value={false} primaryText="Split horizontally" />
                            </DropDownMenu>
                        </ToolbarGroup>
                    </Toolbar>
                    <Paper style={this.getPanelStyle(0)}>
                        <ImageWindowComponent/>
                    </Paper>
                    <Paper style={this.getPanelStyle(1)}>
                        <ImageWindowComponent/>
                    </Paper>
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