import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import AudioRecorderComponent from "../component";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { createBlobUrl } from "utils/AppsmithUtils";
import { FileDataTypes } from "widgets/constants";
import {
  ButtonBoxShadow,
  ButtonBorderRadius,
  ButtonBorderRadiusTypes,
} from "components/constants";

export interface AudioRecorderWidgetProps extends WidgetProps {
  backgroundColor: string;
  borderRadius: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconColor: string;
  isDisabled: boolean;
  isValid: boolean;
  onRecordingStart?: string;
  onRecordingComplete?: string;
  blobURL?: string;
}

class AudioRecorderWidget extends BaseWidget<
  AudioRecorderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the recording starts",
            propertyName: "onRecordingStart",
            label: "onRecordingStart",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the recording ends",
            propertyName: "onRecordingComplete",
            label: "onRecordingComplete",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            options: [
              ButtonBorderRadiusTypes.SHARP,
              ButtonBorderRadiusTypes.ROUNDED,
              ButtonBorderRadiusTypes.CIRCLE,
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["CIRCLE", "SHARP", "ROUNDED"],
              },
            },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  "NONE",
                  "VARIANT1",
                  "VARIANT2",
                  "VARIANT3",
                  "VARIANT4",
                  "VARIANT5",
                ],
              },
            },
          },
          {
            propertyName: "boxShadowColor",
            helpText: "Sets the shadow color of the widget",
            label: "Shadow Color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                regex: /^(?![<|{{]).+/,
              },
            },
          },
          {
            propertyName: "iconColor",
            helpText: "Sets the icon color of the widget",
            label: "Icon color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      blobURL: undefined,
      dataURL: undefined,
      rawBinary: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  handleRecordingStart = () => {
    if (this.props.blobURL) {
      URL.revokeObjectURL(this.props.blobURL);
    }

    this.props.updateWidgetMetaProperty("dataURL", undefined);
    this.props.updateWidgetMetaProperty("rawBinary", undefined);

    if (this.props.onRecordingStart) {
      super.executeAction({
        triggerPropertyName: "onRecordingStart",
        dynamicString: this.props.onRecordingStart,
        event: {
          type: EventType.ON_RECORDING_START,
        },
      });
    }
  };

  handleRecordingComplete = (blobUrl?: string, blob?: Blob) => {
    if (!blobUrl) {
      this.props.updateWidgetMetaProperty("blobURL", undefined);
      this.props.updateWidgetMetaProperty("dataURL", undefined);
      this.props.updateWidgetMetaProperty("rawBinary", undefined);
      return;
    }
    this.props.updateWidgetMetaProperty("blobURL", blobUrl);
    if (blob) {
      const blobIdForBase64 = createBlobUrl(blob, FileDataTypes.Base64);
      const blobIdForRaw = createBlobUrl(blob, FileDataTypes.Binary);

      this.props.updateWidgetMetaProperty("dataURL", blobIdForBase64, {
        triggerPropertyName: "onRecordingComplete",
        dynamicString: this.props.onRecordingComplete,
        event: {
          type: EventType.ON_RECORDING_COMPLETE,
        },
      });
      this.props.updateWidgetMetaProperty("rawBinary", blobIdForRaw, {
        triggerPropertyName: "onRecordingComplete",
        dynamicString: this.props.onRecordingComplete,
        event: {
          type: EventType.ON_RECORDING_COMPLETE,
        },
      });
    }
  };

  getPageView() {
    const {
      backgroundColor,
      blobURL,
      bottomRow,
      iconColor,
      isDisabled,
      leftColumn,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = this.props;

    return (
      <AudioRecorderComponent
        backgroundColor={this.props.backgroundColor}
        blobUrl={blobURL}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        height={(bottomRow - topRow) * parentRowSpace}
        iconColor={iconColor}
        isDisabled={isDisabled}
        onRecordingComplete={this.handleRecordingComplete}
        onRecordingStart={this.handleRecordingStart}
        width={(rightColumn - leftColumn) * parentColumnSpace}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "AUDIO_RECORDER_WIDGET";
  }
}

export default AudioRecorderWidget;
