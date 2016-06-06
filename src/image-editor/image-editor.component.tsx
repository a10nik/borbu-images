import * as React from 'react';
import * as classNames from 'classnames';
import {Image as CanvasImage, Surface as CanvasSurface, Text as CanvasText} from 'react-canvas';
import Dropzone = require('react-dropzone');
import { CircularProgress } from 'material-ui';
import lodash = require("lodash");
import {Paper, FlatButton, RaisedButton, RadioButton, RadioButtonGroup, FontIcon, Toggle, Toolbar, ToolbarGroup, TextField} from "material-ui";
import {FileFileDownload, ImageColorLens, NavigationArrowDropRight} from "material-ui/lib/svg-icons";
import {IconMenu, MenuItem, IconButton, Divider, Dialog} from "material-ui";
import * as ImageUtils from "../image-utils/image-utils";
import {IError} from "../common/errors";
import {ToolbarSeparator} from "material-ui";
import * as Jpeg from "../image-utils/jpeg";
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
    promise?: Promise<void>,
    isJpegDialogOpen: boolean,
    jpegPreview?: ImageUtils.CanvasImage,
    jpegSettings: JpegSettings,
    jpegCompressedSize: number,
    jpegPsnr: number
}

interface JpegSettings {
    yQuantization: Quantization,
    cQuantization: Quantization,
    yDecimation: Jpeg.DecimationType
    cDecimation: Jpeg.DecimationType
}

interface Quantization {
    type: "standardTableBased" | "alphaNGammaTableBased" | "maximaBased",
    alpha: number,
    gamma: number,
    maximaCount: number,
    standardMultiplier: number
}

enum DownloadFormat {
    Png
}

enum Transformation {
    UniformGreyscale, Ccir6011Greyscale, ToYCrCb, FromYCrCb,
    QuantizeY2Cr2Cb2, QuantizeY3Cr1Cb2, QuantizeY3Cr2Cb1, QuantizeR2G2B2, 
    ToLbg64Palette, ToMedianCutPalette, Jpeg
}

export default class ImageEditor extends React.Component<ImageWindowProps, ImageWindowState> {

    constructor(props?) {
        super(props);
        this.state = {
            promise: null,
            isJpegDialogOpen: false,
            jpegPreview: null,
            jpegSettings: {
                yQuantization: {
                    type: "standardTableBased",
                    alpha: 3,
                    gamma: 2,
                    maximaCount: 6,
                    standardMultiplier: 1
                },
                cQuantization: {
                    type: "standardTableBased",
                    alpha: 3,
                    gamma: 2,
                    maximaCount: 6,
                    standardMultiplier: 1                    
                },
                yDecimation: Jpeg.DecimationType.None,
                cDecimation: Jpeg.DecimationType.None
            },
            jpegCompressedSize: -1,
            jpegPsnr: -1
        };
    }

    private getImg(file:File): Promise<ImageUtils.CanvasImage> {
        return ImageUtils.getCanvas(URL.createObjectURL(file))
            .then(canvas => new ImageUtils.CanvasImage(canvas, file.name));
    }

    private onDrop(files:File[]) {
        this.state.promise = this.getImg(files[0])
            .then(img => this.props.onImgLoad(img))
            .catch(() => this.props.onError(new ImageLoadError()));
            
        this.setState(this.state);
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

    private getTransformFn(type: Transformation) {
        switch (type) {
            case Transformation.UniformGreyscale:
                return ImageUtils.toUniformGreyscale;
            case Transformation.Ccir6011Greyscale:
                return ImageUtils.toCcir6011Greyscale;
            case Transformation.ToYCrCb:
                return ImageUtils.toYCrCbCanvas;
            case Transformation.FromYCrCb:
                return ImageUtils.fromYCrCbCanvas;
            case Transformation.QuantizeY2Cr2Cb2:
                return (c => ImageUtils.quantizeCanvasInYCrCb(c, 2, 2, 2));
            case Transformation.QuantizeY3Cr1Cb2:
                return (c => ImageUtils.quantizeCanvasInYCrCb(c, 3, 1, 2));
            case Transformation.QuantizeY3Cr2Cb1:
                return (c => ImageUtils.quantizeCanvasInYCrCb(c, 3, 2, 1));
            case Transformation.QuantizeR2G2B2:
                return (c => ImageUtils.quantizeCanvasInRgb(c, 2, 2, 2));
            case Transformation.ToLbg64Palette:
                return (c => ImageUtils.toLbgColors(c, 64));
            case Transformation.ToMedianCutPalette:
                return (c => ImageUtils.quantizeWithMedCut(c, 6));                
            default:
                throw `No such transformation ${type}`;
        }
    }
    
    private onJpegYDecimationChosen(type) {
        this.state.jpegSettings.yDecimation = 1 * type;
        this.onJpegChanged();
    }
    
    private onJpegCDecimationChosen(type) {
        this.state.jpegSettings.cDecimation = 1 * type;
        this.onJpegChanged();
    }
    
    private getQuantizationFn(q: Quantization, standardTable: number[][]) {
        switch (q.type) {
            case "standardTableBased":
                return sq => Jpeg.quantizeWithTable(sq, standardTable);
            case "alphaNGammaTableBased":
                return sq => Jpeg.quantizeWithTable(sq, Jpeg.quantizationTable(q.alpha, q.gamma));
            case "maximaBased":
                return sq => Jpeg.quantizeByMaxima(sq, q.maximaCount);
            default:
                throw "Unknown quantization type"
        }
    }
    
    private onJpegChanged() {
        let yDecimation = Jpeg.getDecimationFn(this.state.jpegSettings.yDecimation);
        let cDecimation = Jpeg.getDecimationFn(this.state.jpegSettings.cDecimation);
        let yQuantization = this.getQuantizationFn(this.state.jpegSettings.yQuantization,
            Jpeg.getStandardYQuantizationMatrixMultiplied(this.state.jpegSettings.yQuantization.standardMultiplier));
        let cQuantization = this.getQuantizationFn(this.state.jpegSettings.cQuantization,
            Jpeg.getStandardCQuantizationMatrixMultiplied(this.state.jpegSettings.cQuantization.standardMultiplier));
        let compressed = Jpeg.toJpeg(this.props.img.canvas, yDecimation, cDecimation, yQuantization, cQuantization);
        let decomressed = Jpeg.fromJpeg(compressed);  
        this.state.jpegPreview = this.props.img.withCanvas(decomressed);
        this.state.jpegCompressedSize = compressed.yData.length + compressed.cbData.length + compressed.crData.length;
        this.state.jpegPsnr = ImageUtils.getPsnr(this.state.jpegPreview.canvas, this.props.img.canvas); 
        this.setState(this.state);
    }
        
    private transformImage(type: Transformation) {
        if (!this.props.img) {
            this.props.onError(new NoImageError());
        } else if (type === Transformation.Jpeg) {
            this.state.isJpegDialogOpen = true;
            this.onJpegChanged();
        } else {
            this.props.onImgLoad(
                this.props.img.withCanvas(this.getTransformFn(type)(this.props.img.canvas)));
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

    private applyJpeg() {
        this.setState(prev => {
            prev.isJpegDialogOpen = false;
            return prev;
        });
        this.props.onImgLoad(this.state.jpegPreview);
    }
    
    private closeJpegDialog() {
        this.setState(prev => {
            prev.isJpegDialogOpen = false;
            return prev;
        });
    }

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
                            onChange={(ev, val) => this.transformImage(val)}>
                            <MenuItem value={Transformation.UniformGreyscale} primaryText="Uniform greyscale" />
                            <MenuItem value={Transformation.Ccir6011Greyscale} primaryText="CCIR 601-1 greyscale" />
                            <Divider/>
                            <MenuItem value={Transformation.ToYCrCb} primaryText="To YCrCb" />
                            <MenuItem value={Transformation.FromYCrCb} primaryText="From YCrCb" />
                            <Divider/>
                            <MenuItem value={Transformation.QuantizeY2Cr2Cb2} primaryText="Quantize Y:2 Cr:2 Cb:2" />
                            <MenuItem value={Transformation.QuantizeY3Cr1Cb2} primaryText="Quantize Y:3 Cr:1 Cb:2" />
                            <MenuItem value={Transformation.QuantizeY3Cr2Cb1} primaryText="Quantize Y:3 Cr:2 Cb:1" />
                            <Divider/>
                            <MenuItem value={Transformation.QuantizeR2G2B2} primaryText="Quantize R:2 G:2 B:2" />                            
                            <Divider/>
                            <MenuItem value={Transformation.ToLbg64Palette} primaryText="To LBG-64 Palette" />  
                            <MenuItem value={Transformation.ToMedianCutPalette} primaryText="To Median Cut Palette" />  
                            <Divider/>
                            <MenuItem value={Transformation.Jpeg} primaryText="JPEG" />  
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>
                <Dialog open={this.state.isJpegDialogOpen} contentStyle={{
                                                                            width: '80%',
                                                                            maxWidth: 'none',
                                                                            }} autoScrollBodyContent={true} actions={[
                    <FlatButton
                        label="Cancel"
                        primary={false}
                        onTouchTap={() => this.closeJpegDialog()}
                    />,
                    <FlatButton
                        label="Apply"
                        primary={true}
                        keyboardFocused={true}
                        onTouchTap={() => this.applyJpeg()}
                    />
                ]}>
                    <div style={{display: "inline-block", verticalAlign: "top", width: "20%", marginRight: "5%"}}>
                        <div>PSNR: <b>{this.state.jpegPsnr.toFixed(3)}</b> dB</div>
                        <div>Size: <b>{this.state.jpegCompressedSize}</b> bytes</div>
                        {[
                            {dec: "yDecimation", cb: (e, val) => this.onJpegYDecimationChosen(val), title: "Y Channel Decimation"},
                            {dec: "cDecimation", cb: (e, val) => this.onJpegCDecimationChosen(val), title: "Cb-Cr Channel Decimation"}
                        ].map(({dec, cb, title}) =>
                            <div key={dec}>
                                <hr/>
                                {title}
                                <RadioButtonGroup name={dec} onChange={cb} valueSelected={this.state.jpegSettings[dec].toString()}>
                                    <RadioButton
                                        value={Jpeg.DecimationType.Leave2Left.toString()}
                                        label="Leave 2 left"
                                    />
                                    <RadioButton
                                        value={Jpeg.DecimationType.Leave2Top.toString()}
                                        label="Leave 2 top"
                                    />
                                    <RadioButton
                                        value={Jpeg.DecimationType.Leave1TopLeft.toString()}
                                        label="Leave 1 top-left"
                                    />
                                    <RadioButton
                                        value={Jpeg.DecimationType.None.toString()}
                                        label="Do not decimate"
                                    />
                                </RadioButtonGroup>
                            </div>
                        )}
                    </div>
                    <div style={{display: "inline-block", verticalAlign: "top", width: "20%", marginRight: "5%"}}>
                        {[
                            {quan: "yQuantization", title: "Y Channel Quantization"},
                            {quan: "cQuantization", title: "Cb-Cr Channel Quantization"}
                        ].map(({quan, title}, i) =>
                            <div key={quan}>
                                { i !== 0 ? <hr/> : null}
                                {title}
                                <RadioButtonGroup name={quan} onChange={(e, val) => {
                                            this.state.jpegSettings[quan].type = val;
                                            this.onJpegChanged();
                                        }} valueSelected={this.state.jpegSettings[quan].type}>
                                    <RadioButton
                                        value="standardTableBased"
                                        label="Standard tables"
                                    />
                                    <RadioButton
                                        value="alphaNGammaTableBased"
                                        label="Alpha-n-gamma tables"
                                    ></RadioButton>
                                    <RadioButton
                                        value="maximaBased"
                                        label="Leave N maxima"
                                    ></RadioButton>
                                </RadioButtonGroup>
                                    {this.state.jpegSettings[quan].type === "alphaNGammaTableBased" ? 
                                        <TextField floatingLabelText="Alpha" value={this.state.jpegSettings[quan].alpha}
                                            style={{ width: "100px", marginRight: "20px" }}
                                            onChange={(e: any) => {
                                                this.state.jpegSettings[quan].alpha = parseFloat(e.target.value);
                                                this.onJpegChanged();
                                            }}/>
                                        : null}
                                    {this.state.jpegSettings[quan].type === "alphaNGammaTableBased" ?
                                        <TextField floatingLabelText="Gamma" value={this.state.jpegSettings[quan].gamma}
                                            style={{ width: "100px" }}
                                            onChange={(e: any) => {
                                                this.state.jpegSettings[quan].gamma = parseFloat(e.target.value);
                                                this.onJpegChanged();
                                            }}/>
                                        : null}
                                    {this.state.jpegSettings[quan].type === "maximaBased" ?
                                        <TextField floatingLabelText="Maxima count" value={this.state.jpegSettings[quan].maximaCount}
                                            onChange={(e: any) => {
                                                this.state.jpegSettings[quan].maximaCount = parseInt(e.target.value, 10);
                                                this.onJpegChanged();
                                            }}/>
                                        : null}
                                    {this.state.jpegSettings[quan].type === "standardTableBased" ?
                                        <TextField floatingLabelText="Table multiplier" value={this.state.jpegSettings[quan].standardMultiplier}
                                            onChange={(e: any) => {
                                                this.state.jpegSettings[quan].standardMultiplier = parseFloat(e.target.value);
                                                this.onJpegChanged();
                                            }}/>
                                        : null}
                            </div>
                        )}
                    </div>
                    <div style={{display: "inline-block", verticalAlign: "top", width: "49%"}}>
                        <div className={classes.scrollable}>
                            {this.state.jpegPreview ? 
                                <CanvasSurface width={this.state.jpegPreview.canvas.width}
                                            height={this.state.jpegPreview.canvas.height} top={0} left={0}>
                                    <CanvasImage src={this.state.jpegPreview.getSrc()} style={this.getImgStyle()}/>
                                </CanvasSurface>:
                            null}
                        </div>
                    </div>
                </Dialog>
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
