import * as React from 'react';
import { Link } from 'react-router';
import { Paper } from 'material-ui';

import AuthComponent from './auth/ui/auth.component.tsx';
import TodoCounter from './todo/ui/todo.counter.tsx';
import LoadingComponent from './common/loading/loading.component.tsx';
import ImageWindowComponent from './image-window/image-window.component';
import {Toggle} from "material-ui";
import {Toolbar} from "material-ui";
import {ToolbarGroup} from "material-ui";

export default class MainComponent extends React.Component<{ children: any }, { splitVertically: boolean }> {

    constructor(props) {
        this.state = {
            splitVertically: true
        };
        super(props);
    }

    private toggleSplit() {
        this.setState({ splitVertically: !this.state.splitVertically })
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
                        <ToolbarGroup float="left">
                            <div style={{ width: 250 }}>
                                <Toggle toggled={this.state.splitVertically} label="Split vertically" onToggle={()=>this.toggleSplit()}/>
                            </div>
                        </ToolbarGroup>
                    </Toolbar>
                    <Paper style={{
                        display: "inline-block",
                        marginTop: 20,
                        width: this.state.splitVertically ? "48%" : "100%",
                        marginRight: this.state.splitVertically ? "4%" : 0,
                        verticalAlign: "top"
                    }}>
                        <ImageWindowComponent/>
                    </Paper>
                    <Paper style={{
                        marginTop: 20,
                        verticalAlign: "top",
                        display: "inline-block",
                        width: this.state.splitVertically ? "48%" : "100%"
                    }}>
                        <ImageWindowComponent/>
                    </Paper>
                </div>
                <footer className="footer">
                    <Paper zDepth={2}>
                        <div className="container">
                            <div className="row">
                                <div className="col-md-3 col-sm-6">
                                    <i className="fa fa-github fa-lg"></i>
                                    <a href="https://github.com/a10nik">Github</a>
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