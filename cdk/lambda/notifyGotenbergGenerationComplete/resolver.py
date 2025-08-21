def lambda_handler(event, context):
    # event contains arguments passed to the mutation
    key = event['arguments']['key']

    # You could log it if you want
    print(f"Triggering subscription for key: {key}")

    # Return the key — AppSync will send it to subscribers automatically
    return key
