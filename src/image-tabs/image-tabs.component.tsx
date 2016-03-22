import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import lodash = require("lodash");
import {Paper, FlatButton, Toolbar, DropDownMenu, ToolbarGroup, MenuItem} from "material-ui";
import ImageEditor from "../image-editor/image-editor.component";
import ErrorSnackbar from "../common/error-snackbar.component";
import {IError} from "../common/errors";
import {RaisedButton} from "material-ui";
import {Dialog} from "material-ui";
import * as ImageUtils from "../image-utils/image-utils";
import {Popover} from "material-ui";
var styles = require("./image-tabs.component.css");

interface ImageTabsProps {
}

interface ImageTabsState {
    splitVertically: boolean,
    tabImages: ImageUtils.CanvasImage[],
    error?: IError,
    psnrResult?: number,
    psnrButton?:React.ReactInstance
}

class PsnrNeedsBothImagesError implements IError {
    getText():string {
        return "Both images are needed to calculate PSNR";
    }
}

class PsnrDifferentSizesError implements IError {
    getText():string {
        return "Both images have to be of the same dimensions";
    }
}


export default class ImageTabs extends React.Component<ImageTabsProps, ImageTabsState> {

    constructor(props) {
        super(props);

        this.state = {
            tabImages: [null, null],
            splitVertically: true,
            error: null,
            psnrResult: null
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

    setImg(tabId: number, img: ImageUtils.CanvasImage) {
        var newTabs = this.state.tabImages.concat([]);
        newTabs[tabId] = img;
        this.setState(lodash.merge(this.state, {tabImages: newTabs}) as ImageTabsState)
    }

    onError(e: IError) {
        this.setState(lodash.merge(this.state, {error: e}) as ImageTabsState)
    }

    clearError() {
        this.setState(lodash.merge(this.state, {error: null}) as ImageTabsState)
    }

    setSplitVertically(val:boolean) {
        this.setState(lodash.merge(this.state, {splitVertically: val}) as ImageTabsState)
    }

    showPsnr(ev) {
        var [img1, img2] = this.state.tabImages;
        if (!this.state.tabImages[0] || !this.state.tabImages[1])
            return this.onError(new PsnrNeedsBothImagesError());
        if (img1.canvas.width !== img2.canvas.width || img1.canvas.height !== img2.canvas.height)
            return this.onError(new PsnrDifferentSizesError());
        var psnr = ImageUtils.getPsnr(img1.canvas, img2.canvas);
        this.setState(lodash.merge(this.state, {
            psnrResult: psnr,
            psnrButton: ev.currentTarget as React.ReactInstance
        }) as ImageTabsState)
    }

    closePsnr() {
        this.setState(lodash.merge(this.state, {psnrResult: null}) as ImageTabsState)
    }

    render() {
        return(
            <div>
                <Toolbar>
                    <ToolbarGroup firstChild={true} float="left">
                        <DropDownMenu value={this.state.splitVertically} onChange={(e, i, val) => this.setSplitVertically(val)}>
                            <MenuItem value={true} primaryText="Split vertically" />
                            <MenuItem value={false} primaryText="Split horizontally" />
                        </DropDownMenu>
                        <RaisedButton label="Calculate PSNR" onTouchTap={(ev) => this.showPsnr(ev)}/>
                        <Popover
                            open={this.state.psnrResult !== null}
                            anchorEl={this.state.psnrButton}
                            anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                            targetOrigin={{horizontal: 'left', vertical: 'top'}}
                            onRequestClose={() => this.closePsnr()}
                        >
                            <div style={{padding: 20}}>
                                PNSR: <b>{this.state.psnrResult && this.state.psnrResult.toFixed(2)} dB</b>
                            </div>
                        </Popover>
                    </ToolbarGroup>
                </Toolbar>
                <Paper style={this.getPanelStyle(0)}>
                    <ImageEditor img={this.state.tabImages[0] ? this.state.tabImages[0] : null}
                                 onImgLoad={img => this.setImg(0, img)}
                                 onError={(e) => this.onError(e)}/>
                </Paper>
                <Paper style={this.getPanelStyle(1)}>
                    <ImageEditor img={this.state.tabImages[1] ? this.state.tabImages[1] : null}
                                 onImgLoad={img => this.setImg(1, img)}
                                 onError={(e) => this.onError(e)}/>
                </Paper>
                <ErrorSnackbar error={this.state.error} clearError={() => this.clearError()}/>
            </div>
        );
    }

}
