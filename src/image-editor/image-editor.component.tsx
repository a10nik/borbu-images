import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import { CircularProgress } from 'material-ui';
import lodash = require("lodash");
import {Paper, FlatButton, FontIcon, Toggle, Toolbar, ToolbarGroup} from "material-ui";
import {FileFileDownload} from "material-ui/lib/svg-icons";
import {IconMenu, MenuItem, IconButton} from "material-ui";
import * as ImageUtils from "../image-utils/image-utils";
import {IError} from "../common/errors";
import {ToolbarSeparator} from "material-ui";
var classes = require("./image-editor.component.css");


class ImageLoadError implements IError {
    getText():string { return "Cannot load image"; }
}

class EmptyImageDownloadError implements IError {
    getText():string { return "You dragged no images to download"; }
}


interface ImageWindowProps {
    img?: HTMLImageElement,
    onImgLoad: (img: HTMLImageElement) => void,
    onError: (e: IError) => void,
}

interface ImageWindowState {
}

enum DownloadFormat {
    Png
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
            img.name = files[0].name;
        });
    }

    private onDrop(files:File[]) {
        this.getImg(files)
            .then(img => this.props.onImgLoad(img))
            .catch(() => this.props.onError(new ImageLoadError()));
    }

    private getImgStyle() {
        return {
            top: 0,
            left: 0,
            width: this.props.img.width,
            height: this.props.img.height
        };
    }

    downloadImage(format: DownloadFormat) {
        if (!this.props.img)
            this.props.onError(new EmptyImageDownloadError());
        var canvas = ImageUtils.imgToCanvas(this.props.img);
        switch (format) {
            case DownloadFormat.Png:
                let pngUrl = canvas.toDataURL("image/png");
                let name = this.props.img.name
                    ? (this.props.img.name.replace(/\.[^/.]+$/, "") + ".png")
                    : "image.png";
                ImageEditor.downloadFile(pngUrl, name);
                break;
            default:
                throw new Error("unknown format");
        }
    }

    static downloadFile(data, filename) {
        var a : any = document.createElement('a');
        a.href = data;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
    };

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
                        <IconMenu
                            iconButtonElement={<IconButton><FileFileDownload/></IconButton>}
                            onChange={(ev, val) => this.downloadImage(val)}
                        >
                            <MenuItem value={DownloadFormat.Png} primaryText="As PNG" />
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>

                <div className={classes.scrollable}>
                    <Dropzone style={{}} onDropAccepted={this.onDrop.bind(this)} accept="image/*">
                        {this.props.img ?
                            <CanvasSurface width={this.props.img.width} height={this.props.img.height} top={0} left={0}>
                                <CanvasImage src={this.props.img.src} style={this.getImgStyle()}/>
                            </CanvasSurface> :
                            <Paper style={{padding: 30}}>
                                Here the loaded image will appear
                            </Paper>
                        }
                    </Dropzone>
                </div>
            </Paper>
        );
    }

}
