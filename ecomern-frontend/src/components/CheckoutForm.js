import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCreateOrderMutation } from "../services/appApi";

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState("");
  const [createOrder, { isLoading, isError, isSuccess }] =
    useCreateOrderMutation();
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [paying, setPaying] = useState(false);


  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements || user.cart.count <= 0) return;
    setPaying(true);

    try {

      const { client_secret } = await fetch(
        "http://localhost:8080/create-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer sk_test_51OaHU4SElHmAt7JalhN5PvUS3V7WSV0fztwgO17Q7zW6ymWcyKTe68waCsTAjk7kaq5pWnFmdpjUEuxPPgFI2Wkc00BZQwXg0y",
          },
          body: JSON.stringify({
            amount: user.cart.total,
            description: "Purchase of Electronics",
          }),
        }
      ).then((res) => res.json());

    console.log("Client Secret:", client_secret);

    const cardElementa = elements.getElement(CardElement);
    console.log(cardElementa)
    
    const { paymentIntent } = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });
    
    console.log("Payment Intent Result:", paymentIntent);

      setPaying(false);

      if (paymentIntent.status === "succeeded") {
        // Payment succeeded
        createOrder({
          userId: user._id,
          cart: user.cart,
          address,
          country,
        }).then((res) => {
          if (!isLoading && !isError) {
            setAlertMessage(`Payment ${paymentIntent.status}`);
            // Navigate to the orders page after a delay
            setTimeout(() => {
              navigate("/orders");
            }, 3000);
          }
        });
      } else {
        // Payment failed
        setAlertMessage(`Payment ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setAlertMessage("Error processing payment. Please try again.");
    }
  }

  

  return (
    <Col className="cart-payment-container">
      <Form onSubmit={handlePay}>
        <Row>
          {alertMessage && <Alert>{alertMessage}</Alert>}
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="First Name"
                value={user.name}
                disabled
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="text"
                placeholder="Email"
                value={user.email}
                disabled
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={7}>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <label htmlFor="card-element">Card</label>
        <CardElement id="card-element" />
        <Button
          className="mt-3"
          type="submit"
          disabled={user.cart.count <= 0 || paying || isSuccess}
        >
          {paying ? "Processing..." : "Pay"}
        </Button>
      </Form>
    </Col>
  );
}

export default CheckoutForm;
