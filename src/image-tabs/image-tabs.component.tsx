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
import {getPsnr} from "../image-utils/image-utils";
import {Popover} from "material-ui";
var styles = require("./image-tabs.component.css");

interface ImageTabsProps {
}

interface ImageTabsState {
    splitVertically: boolean,
    tabs: TabState[],
    error?: IError,
    psnrResult?: number,
    psnrButton?:React.ReactInstance
}

interface TabState {
    img: HTMLImageElement
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
            tabs: [null, null],
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

    setImg(tabId: number, img: HTMLImageElement) {
        var newTabs = this.state.tabs.concat([]);
        newTabs[tabId] = { img: img };
        this.setState(lodash.merge(this.state, {tabs: newTabs}) as ImageTabsState)
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
        if (!this.state.tabs[0] || !this.state.tabs[1])
            return this.onError(new PsnrNeedsBothImagesError());
        var img1 = this.state.tabs[0].img;
        var img2 = this.state.tabs[1].img;
        if (img1.width !== img2.width || img1.height !== img2.height)
            return this.onError(new PsnrDifferentSizesError());
        var psnr = getPsnr(img1, img2);
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
                    <ImageEditor img={this.state.tabs[0] ? this.state.tabs[0].img : null}
                                 onImgLoad={img => this.setImg(0, img)}
                                 onError={(e) => this.onError(e)}/>
                </Paper>
                <Paper style={this.getPanelStyle(1)}>
                    <ImageEditor img={this.state.tabs[1] ? this.state.tabs[1].img : null}
                                 onImgLoad={img => this.setImg(1, img)}
                                 onError={(e) => this.onError(e)}/>
                </Paper>
                <ErrorSnackbar error={this.state.error} clearError={() => this.clearError()}/>
            </div>
        );
    }

}
