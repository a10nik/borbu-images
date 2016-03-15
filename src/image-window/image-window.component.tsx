import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import { CircularProgress } from 'material-ui';
import lodash = require("lodash");
import {Paper, FlatButton} from "material-ui";
import {FontIcon} from "material-ui";
import {Toggle} from "material-ui";
import {Toolbar} from "material-ui";
import {ToolbarGroup} from "material-ui";

var styles = require("./image-window.component.css");

interface ImageWindowProps {
}

interface ImageWindowState {
    loadingState: LoadingState
    img?: HTMLImageElement
}

enum LoadingState {
    Loading, Success, Fail
}

export default class ImageWindowComponent extends React.Component<ImageWindowProps, ImageWindowState> {

    constructor(props) {
        super(props);

        this.state = {
            img: null,
            loadingState: LoadingState.Success
        };
    }

    private getImg(files: File[]): Promise<HTMLImageElement> {
        return new Promise((accept, reject) => {
            var img = new Image();
            img.onload = function() {
                accept(img)
            };
            img.onerror = function(err) {
                reject(err)
            };
            img.src = URL.createObjectURL(files[0]);
        });
    }

    private setLoadingState(newState: LoadingState) {
        this.setState({
            img: this.state.img,
            loadingState: newState
        });
    }

    private setImg(newImg?: HTMLImageElement) {
        this.setState({
            img: newImg,
            loadingState: this.state.loadingState
        });
    }

    private onDrop(files: File[]) {
        this.setLoadingState(LoadingState.Loading);
        this.getImg(files)
            .then(img => this.setImg(img))
            .then(() => this.setLoadingState(LoadingState.Success))
            .catch(() => this.setLoadingState(LoadingState.Fail));
    }

    private getImgStyle() {
        return {
            top: 0,
            left: 0,
            width: this.state.img.width,
            height: this.state.img.height
        };
    }

    render() {
        return(
            <Paper>
                <Toolbar>
                    <ToolbarGroup float="left" firstChild={true}>
                        <Dropzone style={{display: "inline-block"}} onDropAccepted={this.onDrop.bind(this)} accept="image/*">
                            <FlatButton label="Drop image here"/>
                        </Dropzone>
                    </ToolbarGroup>
                </Toolbar>

                <div className={styles.scrollable}>
                    {this.state.img ?
                        <CanvasSurface width={this.state.img.width} height={this.state.img.height} top={0} left={0}>
                            <CanvasImage src={this.state.img.src} style={this.getImgStyle()} />
                        </CanvasSurface> :
                        null
                    }
                </div>
            </Paper>
        );
    }

    private getDropzoneStyle(): any {
        if (this.state.loadingState !== LoadingState.Success ||
            this.state.img === null)
            return {};
        return {
            width: this.state.img.width,
        };
    }
}
