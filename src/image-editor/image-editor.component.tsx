import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import { CircularProgress } from 'material-ui';
import lodash = require("lodash");
import {Paper, FlatButton, FontIcon, Toggle, Toolbar, ToolbarGroup} from "material-ui";
import {FileFileDownload, ImageColorLens} from "material-ui/lib/svg-icons";
import {IconMenu, MenuItem, IconButton} from "material-ui";
import * as ImageUtils from "../image-utils/image-utils";
import {IError} from "../common/errors";
import {ToolbarSeparator} from "material-ui";
var classes = require("./image-editor.component.css");


class ImageLoadError implements IError {
    getText():string { return "Cannot load image"; }
}

class NoImageError implements IError {
    getText():string { return "You need to drag an image here first"; }
}

interface ImageWindowProps {
    img?: ImageUtils.CanvasImage,
    onImgLoad: (img: ImageUtils.CanvasImage) => void,
    onError: (e: IError) => void,
}

interface ImageWindowState {
    promise?: Promise<void>
}

enum DownloadFormat {
    Png
}

enum Greyscale {
    Uniform, Ccir6011
}

export default class ImageEditor extends React.Component<ImageWindowProps, ImageWindowState> {

    private getImg(file:File): Promise<ImageUtils.CanvasImage> {
        return ImageUtils.getCanvas(URL.createObjectURL(file))
            .then(canvas => new ImageUtils.CanvasImage(canvas, file.name));
    }

    private onDrop(files:File[]) {
        let promise = this.getImg(files[0])
            .then(img => this.props.onImgLoad(img))
            .catch(() => this.props.onError(new ImageLoadError()));
        this.setState({ promise: promise });
    }

    private getImgStyle() {
        let img = this.props.img;
        return {
            top: 0,
            left: 0,
            width: img ? img.canvas.width : 0,
            height: img ? img.canvas.height : 0
        };
    }

    private toGreyscale(type: Greyscale) {
        if (!this.props.img)
            return this.props.onError(new NoImageError());
        switch (type) {
            case Greyscale.Uniform:
                return this.props.onImgLoad(
                    this.props.img.withCanvas(ImageUtils.toUniformGreyscale(this.props.img.canvas)));
            case Greyscale.Ccir6011:
                return this.props.onImgLoad(
                    this.props.img.withCanvas(ImageUtils.toCcir6011Greyscale(this.props.img.canvas)));
        }
        
    }
    
    downloadImage(format: DownloadFormat) {
        if (!this.props.img)
            this.props.onError(new NoImageError());
        switch (format) {
            case DownloadFormat.Png:
                let pngUrl = this.props.img.canvas.toDataURL("image/png");
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
                        <Dropzone className={classes.buttonDropzone} style={{}}
                                  onDropAccepted={this.onDrop.bind(this)}
                                  accept="image/*">
                            <FlatButton style={{float: "left", margin: "10px 24px"}} label="Drop image here"/>
                        </Dropzone>
                        <IconMenu iconButtonElement={<IconButton><FileFileDownload/></IconButton>}
                            onChange={(ev, val) => this.downloadImage(val)}>
                            <MenuItem value={DownloadFormat.Png} primaryText="As PNG" />
                        </IconMenu>
                        <IconMenu iconButtonElement={<IconButton><ImageColorLens/></IconButton>}
                            onChange={(ev, val) => this.toGreyscale(val)}>
                            <MenuItem value={Greyscale.Uniform} primaryText="Uniform greyscale" />
                            <MenuItem value={Greyscale.Ccir6011} primaryText="CCIR 601-1 greyscale" />
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>

                <div className={classes.scrollable}>
                    <Dropzone style={{}} onDropAccepted={this.onDrop.bind(this)} accept="image/*">
                        {this.props.img ?
                            <CanvasSurface width={this.props.img.canvas.width} height={this.props.img.canvas.height} top={0} left={0}>
                                <CanvasImage src={this.props.img.getSrc()} style={this.getImgStyle()}/>
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
