import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import { CircularProgress } from 'material-ui';
import lodash = require("lodash");
import {Paper, FlatButton, FontIcon, Toggle, Toolbar, ToolbarGroup} from "material-ui";
var classes = require("./image-editor.component.css");

interface ImageWindowProps {
    img?: HTMLImageElement,
    onImgLoad: (HTMLImageElement) => void,
    onImgLoadError: () => void
}

interface ImageWindowState {
}

export default class ImageEditor extends React.Component<ImageWindowProps, ImageWindowState> {

    private getImg(files:File[]):Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((accept, reject) => {
            var img = new Image();
            img.onload = function () {
                accept(img);
            };
            img.onerror = function (err) {
                reject(err);
            };
            img.src = URL.createObjectURL(files[0]);
        });
    }

    private onDrop(files:File[]) {
        this.getImg(files)
            .then(img => this.props.onImgLoad(img))
            .catch(() => this.props.onImgLoadError());
    }

    private getImgStyle() {
        return {
            top: 0,
            left: 0,
            width: this.props.img.width,
            height: this.props.img.height
        };
    }

    render() {
        return (
            <Paper>
                <Toolbar className={classes.editorToolbar}>
                    <ToolbarGroup float="left" firstChild={true}>
                        <FlatButton label="Drop image here">
                            <Dropzone className={classes.invisibleDropzone} style={{}}
                                  onDropAccepted={this.onDrop.bind(this)}
                                  accept="image/*"/>
                        </FlatButton>
                    </ToolbarGroup>
                </Toolbar>

                <div className={classes.scrollable}>
                    {this.props.img ?
                        <CanvasSurface width={this.props.img.width} height={this.props.img.height} top={0} left={0}>
                            <CanvasImage src={this.props.img.src} style={this.getImgStyle()}/>
                        </CanvasSurface> :
                        <Paper style={{padding: 30}}>
                            Here the loaded image will appear
                        </Paper>
                    }
                </div>
            </Paper>
        );
    }

    private getDropzoneStyle():any {
        if (this.props.img === null)
            return {};
        return {
            width: this.props.img.width,
        };
    }
}
