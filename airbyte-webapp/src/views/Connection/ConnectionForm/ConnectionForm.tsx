import React, { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import styled from "styled-components";
import { Field, FieldProps, Form, Formik } from "formik";

import { SyncSchema } from "core/domain/catalog";
import { Source } from "core/resources/Source";
import { Destination } from "core/resources/Destination";
import ResetDataModal from "components/ResetDataModal";
import { ModalTypes } from "components/ResetDataModal/types";
import { equal } from "utils/objects";

import { ControlLabels, DropDown, DropDownRow, Input, Label } from "components";

import BottomBlock from "./components/BottomBlock";
import Connector from "./components/Connector";
import SchemaField from "./components/SchemaField";
import EditControls from "./components/EditControls";
import { useFrequencyDropdownData, useInitialSchema } from "./useInitialSchema";
import { useDestinationDefinitionSpecificationLoadAsync } from "components/hooks/services/useDestinationHook";
import { ConnectionFormValues, connectionValidationSchema } from "./formConfig";
import NormalizationField from "./components/NormalizationField";
import SectionTitle from "./components/SectionTitle";
import { TransformationField } from "./components/TransformationField";
import {
  Normalization,
  NormalizationType,
  Operation,
  OperatorType,
} from "core/domain/connector/operation";

const FormContainer = styled(Form)`
  padding: 22px 27px 23px 24px;
`;

const EditLaterMessage = styled(Label)`
  margin: -20px 0 29px;
`;

const ControlLabelsWithMargin = styled(ControlLabels)`
  margin-bottom: 29px;
`;

const ConnectorLabel = styled(ControlLabels)`
  max-width: 247px;
  margin-right: 20px;
  vertical-align: top;
`;

type ConnectionFormProps = {
  onSubmit: (values: ConnectionFormValues) => void;
  className?: string;
  errorMessage?: React.ReactNode;
  additionBottomControls?: React.ReactNode;
  successMessage?: React.ReactNode;
  onReset?: (connectionId?: string) => void;
  onDropDownSelect?: (item: DropDownRow.IDataItem) => void;
  onCancel?: () => void;
  editSchemeMode?: boolean;
  isEditMode?: boolean;
  isLoading?: boolean;
  additionalSchemaControl?: React.ReactNode;
  sourceIcon?: string;
  destinationIcon?: string;

  syncCatalog: SyncSchema;
  source: Source;
  destination: Destination;
  prefixValue?: string;
  frequencyValue?: string;
  operations?: Operation[];
};

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onSubmit,
  onReset,
  onCancel,
  sourceIcon,
  destinationIcon,
  className,
  errorMessage,
  onDropDownSelect,
  frequencyValue,
  prefixValue,
  isEditMode,
  successMessage,
  additionBottomControls,
  editSchemeMode,
  isLoading,
  additionalSchemaControl,
  source,
  destination,
  operations,
  ...props
}) => {
  const initialSchema = useInitialSchema(props.syncCatalog);
  const destDefinition = useDestinationDefinitionSpecificationLoadAsync(
    destination.destinationDefinitionId
  );
  const dropdownData = useFrequencyDropdownData();

  const [modalIsOpen, setResetModalIsOpen] = useState(false);
  const formatMessage = useIntl().formatMessage;

  const transformations = operations?.filter(
    (op) => op.operatorConfiguration.operatorType === OperatorType.Dbt
  );
  const normalization = (operations?.find(
    (op) => op.operatorConfiguration.operatorType === OperatorType.Normalization
  ) as Normalization)?.operatorConfiguration?.normalization;

  return (
    <Formik
      initialValues={{
        syncCatalog: initialSchema,
        frequency: frequencyValue || "",
        prefix: prefixValue || "",
        transformations: transformations ?? [],
        normalization: normalization ?? NormalizationType.RAW,
      }}
      // validateOnBlur={true}
      // validateOnChange={true}
      validationSchema={connectionValidationSchema}
      onSubmit={async (values) => {
        // TODO: fix
        const formValues: any = connectionValidationSchema.cast(values, {
          context: { isRequest: true },
        });

        const newOperations: Operation[] = [...values.transformations];

        if (values.normalization !== NormalizationType.RAW) {
          const normalizationOperation = operations?.find(
            (op) =>
              op.operatorConfiguration.operatorType ===
              OperatorType.Normalization
          );

          if (normalizationOperation) {
            newOperations.push(normalizationOperation);
          } else {
            newOperations.push({
              name: "Normalization",
              operatorConfiguration: {
                operatorType: OperatorType.Normalization,
                normalization: values.normalization,
              },
            });
          }
        }

        if (newOperations.length > 0) {
          formValues.withOperations = newOperations;
        }

        await onSubmit(formValues);

        const requiresReset =
          isEditMode &&
          !equal(initialSchema, values.syncCatalog) &&
          !editSchemeMode;
        if (requiresReset) {
          setResetModalIsOpen(true);
        }
      }}
    >
      {({ isSubmitting, setFieldValue, values, isValid, dirty, resetForm }) => (
        <FormContainer className={className}>
          <ControlLabelsWithMargin>
            <ConnectorLabel
              label={formatMessage({
                id: "form.sourceConnector",
              })}
            >
              <Connector name={source.name} icon={sourceIcon} />
            </ConnectorLabel>
            <ConnectorLabel
              label={formatMessage({
                id: "form.destinationConnector",
              })}
            >
              <Connector name={destination.name} icon={destinationIcon} />
            </ConnectorLabel>
            <Field name="frequency">
              {({ field, meta }: FieldProps<string>) => (
                <ConnectorLabel
                  error={!!meta.error && meta.touched}
                  label={formatMessage({
                    id: "form.frequency",
                  })}
                >
                  <DropDown
                    {...field}
                    error={!!meta.error && meta.touched}
                    data={dropdownData}
                    onSelect={(item) => {
                      if (onDropDownSelect) {
                        onDropDownSelect(item);
                      }
                      setFieldValue(field.name, item.value);
                    }}
                  />
                </ConnectorLabel>
              )}
            </Field>
          </ControlLabelsWithMargin>
          <Field name="prefix">
            {({ field }: FieldProps<string>) => (
              <ControlLabelsWithMargin
                label={formatMessage({
                  id: "form.prefix",
                })}
                message={formatMessage({
                  id: "form.prefix.message",
                })}
              >
                <Input
                  {...field}
                  type="text"
                  placeholder={formatMessage({
                    id: `form.prefix.placeholder`,
                  })}
                />
              </ControlLabelsWithMargin>
            )}
          </Field>
          <SchemaField
            destinationSupportedSyncModes={
              destDefinition.supportedDestinationSyncModes
            }
            additionalControl={additionalSchemaControl}
          />
          <SectionTitle>
            <FormattedMessage id="form.normalizationTransformation" />
          </SectionTitle>
          <NormalizationField />
          <TransformationField />
          {!isEditMode ? (
            <EditLaterMessage
              message={<FormattedMessage id="form.dataSync.message" />}
            />
          ) : null}
          {isEditMode ? (
            <>
              <EditControls
                isSubmitting={isLoading || isSubmitting}
                isValid={isValid}
                dirty={dirty || !equal(initialSchema, values.syncCatalog)}
                resetForm={() => {
                  resetForm();
                  if (onCancel) {
                    onCancel();
                  }
                }}
                successMessage={successMessage}
                errorMessage={errorMessage}
                editSchemeMode={editSchemeMode}
              />
              {modalIsOpen && (
                <ResetDataModal
                  modalType={ModalTypes.RESET_CHANGED_COLUMN}
                  onClose={() => setResetModalIsOpen(false)}
                  onSubmit={async () => {
                    await onReset?.();
                    setResetModalIsOpen(false);
                  }}
                />
              )}
            </>
          ) : (
            <BottomBlock
              additionBottomControls={additionBottomControls}
              isSubmitting={isSubmitting}
              isValid={isValid}
              errorMessage={errorMessage}
            />
          )}
        </FormContainer>
      )}
    </Formik>
  );
};

export default ConnectionForm;
