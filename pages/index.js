import React, { useEffect } from 'react';
import { useForm, useField } from 'react-final-form-hooks';
import styled from 'styled-components';
import {
  Flex,
  Box,
  Button,
  Text,
  Heading,
  Input,
  Textarea,
  Field,
  Select,
  Icon
} from 'rimble-ui';

const StyledInput = styled(Input)`
  width: 100%;
`;

const StyledTextArea = styled(Textarea)`
  width: 100%;
  resize: none;
`;

const selectOptions = {
  Members: 'Member',
  Men: "Men's Ensemble",
  Women: 'Ladies',
  Board: 'Board Member',
  Barlock: 'Barlock'
};

const selectItems = Object.keys(selectOptions);

const onSubmit = async ({ message, role, password }) => {
  const response = await fetch(
    'https://zktt9bzol4.execute-api.us-east-1.amazonaws.com/dev/members/text',
    {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${password}`
      }),
      body: JSON.stringify({
        message,
        role: selectOptions[role],
        auth: password
      })
    }
  );

  const errors = {};

  if (response.status === 200) {
    return;
  }

  if (response.status === 401) {
    errors.password = 'Incorrect Password';
  }

  if (response.status === 400) {
    errors.message = 'Please provide a message';
  }

  return errors;
};

const validate = values => {
  const errors = {};

  if (!values.message) {
    errors.message = 'A message is required';
  }

  if (values.message && values.message.length > 140) {
    errors.message = 'Your message is too long';
  }

  if (!values.password) {
    errors.password = 'A Password is required.';
  }
  return errors;
};

export default function() {
  const formData = useForm({
    onSubmit,
    validate
  });

  const {
    form,
    handleSubmit,
    values,
    pristine,
    submitting,
    hasValidationErrors,
    submitSucceeded,
    dirtySinceLastSubmit
  } = formData;

  const message = useField('message', form);
  const password = useField('password', form);
  const role = useField('role', form);

  useEffect(() => {
    if (role.input.value === '' && Object.keys(role.meta).length > 0) {
      role.input.onChange(selectItems[0]);
    }
  });

  return (
    <Flex alignItems="center" flexDirection="column" px={2}>
      <Box width={1} pb="4">
        <Heading.h1 textAlign="center">Heart of Carolina</Heading.h1>
        <Heading.h3 textAlign="center">
          Send a text message to the chorus
        </Heading.h3>
      </Box>
      {!dirtySinceLastSubmit && submitSucceeded && (
        <Flex bg="blue" p={3} widht={'100%'}>
          <Icon name={'Info'} mr={2} color="white" />
          <Text color="white">Message Sent</Text>
        </Flex>
      )}
      <Box width={[1, 3 / 4, 1 / 2]}>
        <form onSubmit={handleSubmit}>
          <Field label="Message">
            <StyledTextArea rows="4" {...message.input} maxLength="140" />
          </Field>
          <Flex justifyContent="space-between" mb="3">
            <Text color="red">
              {message.meta.touched && message.meta.error
                ? message.meta.error
                : null}
              {!message.meta.dirtySinceLastSubmit && message.meta.submitFailed
                ? message.meta.submitError
                : null}
            </Text>
            <Text>{values.message ? values.message.length : 0} / 140</Text>
          </Flex>
          <Field label="Password" mb="4">
            <StyledInput {...password.input} type="password" />
            {password.meta.touched && password.meta.error && (
              <Text color="red">{password.meta.error}</Text>
            )}
            {!password.meta.dirtySinceLastSubmit &&
              password.meta.submitFailed && (
                <Text color="red">{password.meta.submitError}</Text>
              )}
          </Field>

          <Flex justifyContent="space-between" mb="3">
            <Field label="What Group" mb="3">
              <Select {...role.input} items={selectItems} />
            </Field>
            <Box pt={4}>
              <Button
                disabled={submitting || pristine || hasValidationErrors}
                type="submit"
              >
                Send Text
              </Button>
            </Box>
          </Flex>
        </form>
      </Box>
      {/*<Box>{JSON.stringify(formData, null, 2)}</Box>*/}
    </Flex>
  );
}
